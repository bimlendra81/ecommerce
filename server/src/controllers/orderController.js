import { pool } from '../config/db.js';
import { getShippingAdapter, loadSettings } from '../services/shipping/index.js';
import { syncTrackingIfStale } from '../services/shipping/tracking.js';
import { computeWeight, SHIPPO_INTERNATIONAL_METHOD_ID, estimateInternationalFee } from '../services/shipping/quote.js';
import { computeParcel } from '../services/shipping/parcel.js';
import { invalidateStorefront } from '../utils/cache.js';
import { effectivePrice } from '../utils/price.js';
import { resolveCoupon } from '../utils/coupons.js';

async function getShippingForOrder(orderId, conn = pool) {
  const [rows] = await conn.query('SELECT * FROM shipping_info WHERE order_id = ?', [orderId]);
  if (rows.length === 0) return null;
  const info = rows[0];
  const [events] = await conn.query(
    'SELECT id, event, location, notes, created_at FROM shipping_events WHERE shipping_info_id = ? ORDER BY created_at ASC, id ASC',
    [info.id]
  );
  return { ...info, events };
}

async function getOrderById(orderId, userId, conn = pool) {
  const [orderRows] = await conn.query(
    'SELECT id, user_id, total, subtotal, shipping_fee, discount, tax_fee, coupon_id, status, created_at FROM orders WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [orderId, userId]
  );
  if (orderRows.length === 0) return null;
  const order = orderRows[0];
  let coupon = null;
  if (order.coupon_id) {
    const [couponRows] = await conn.query('SELECT id, code, type, value FROM coupons WHERE id = ?', [order.coupon_id]);
    if (couponRows.length > 0) coupon = couponRows[0];
  }
  const [items] = await conn.query('SELECT id, product_id, name, price, quantity FROM order_items WHERE order_id = ?', [orderId]);
  const [payments] = await conn.query(
    'SELECT gateway, txn_id, amount, currency, status AS payment_status, refund_status FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1',
    [orderId]
  );
  return { ...order, coupon, items, shipping: await getShippingForOrder(orderId, conn), payment: payments[0] || null };
}

async function resolveAddress(conn, userId, body) {
  if (body.address_id) {
    const [rows] = await conn.query('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [body.address_id, userId]);
    if (rows.length === 0) throw Object.assign(new Error('Address not found'), { status: 404 });
    return rows[0];
  }
  return body.shipping_address;
}

export async function createOrder(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const [cartRows] = await conn.query(
      `SELECT ci.product_id, ci.quantity, p.name, p.price, p.sale_price, p.sale_ends_at, p.stock, p.weight_grams,
              p.length_cm, p.width_cm, p.height_cm, p.dimension_unit
       FROM carts ci JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ? AND p.deleted_at IS NULL`,
      [req.user.id]
    );
    if (cartRows.length === 0) return res.status(400).json({ message: 'Cart is empty' });

    for (const item of cartRows) {
      item.price = effectivePrice(item);
      if (item.quantity > item.stock) return res.status(400).json({ message: `Not enough stock for ${item.name}` });
    }

    const isShippoInternational = Number(req.body.shipping_method_id) === SHIPPO_INTERNATIONAL_METHOD_ID;
    let shippoRateId = (req.body.shippo_rate_id || '').trim();
    let method;
    if (isShippoInternational) {
      method = { id: null, name: 'Shippo (International)' };
    } else if (shippoRateId) {
      method = { id: null, name: 'Shippo Live Rate' };
    } else {
      const [methodRows] = await conn.query('SELECT * FROM shipping_methods WHERE id = ? AND active = 1', [req.body.shipping_method_id]);
      if (methodRows.length === 0) return res.status(400).json({ message: 'Shipping method is not available' });
      method = methodRows[0];
    }
    const address = await resolveAddress(conn, req.user.id, req.body);
    // Send the customer's real account name to Shippo (recipient on the label).
    const [userNameRows] = await conn.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
    if (userNameRows[0]?.name) address.user_name = userNameRows[0].name;

    const subtotal = cartRows.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
    const settings = await loadSettings();
    const { adapter, provider } = await getShippingAdapter();
    if (isShippoInternational && provider !== 'shippo') {
      return res.status(400).json({ message: 'Shippo (International) is only available when Shippo is the active shipping provider.' });
    }
    const weight = await computeWeight({ items: cartRows, settings });
    const parcel = computeParcel({ items: cartRows, settings });

    let shippingFee = 0;
    let shippingCarrier = provider;
    let shippingService = '';

    // Live Shippo rate: re-fetch server-side, never trust client price.
    // Rate ids are per-shipment, so match the chosen quote by service (then by
    // amount as a fallback) and store the fresh rate_id for the label purchase.
    if (shippoRateId && provider === 'shippo' && adapter?.listRates) {
      const rates = await adapter.listRates({ parcel, destination: address, settings, items: cartRows, amount: subtotal });
      if (rates.length === 0) {
        return res.status(400).json({ message: 'No live shipping rates available for this destination. Please choose a rate again.' });
      }
      const qService = String(req.body.shipping_service || '').trim().toLowerCase();
      const qFee = Number(req.body.shipping_fee);
      let match = rates.find((r) => r.service && r.service.toLowerCase() === qService);
      if (!match && qFee > 0) {
        match = rates.find((r) => Math.abs(Number(r.amount) - qFee) < 0.01);
      }
      if (!match) {
        return res.status(400).json({ message: 'Selected shipping rate is no longer available. Please choose a rate again.' });
      }
      shippingFee = Number(match.amount);
      shippingCarrier = match.carrier;
      shippingService = match.service;
      shippoRateId = match.rate_id;
    } else if (isShippoInternational) {
      let rate = null;
      try {
        rate = await adapter.rateFor({ method: { name: 'Shippo International' }, weight, destination: address, settings });
      } catch (err) {
        rate = { error: err.message || 'Shippo rate fetch failed' };
      }
      if (!adapter?.isConfigured?.()) {
        return res.status(400).json({ message: 'Shippo is not configured. Add an API token in Admin > Shipping.' });
      }
      shippingFee = rate && rate.fee != null && !rate.error ? Number(rate.fee) : estimateInternationalFee({ weight });
    } else {
      shippingFee = Number(method.fee);
      try {
        const rate = await adapter.rateFor({ method, weight, destination: address, settings });
        if (rate && rate.fee != null) shippingFee = Number(rate.fee);
      } catch (err) {
        shippingFee = Number(method.fee);
      }
    }

    const freeThreshold = Number(settings.free_shipping_threshold);
    if (freeThreshold && subtotal >= freeThreshold && !shippoRateId) shippingFee = 0;

    let discount = 0;
    let couponId = null;
    const couponRes = await resolveCoupon(req.body.coupon_code, req.user.id, subtotal);
    if (req.body.coupon_code) {
      if (!couponRes) return res.status(400).json({ message: 'Invalid or expired coupon code' });
      discount = couponRes.discount;
      couponId = couponRes.coupon.id;
    }

    const taxable = Math.max(subtotal - discount, 0);
    const taxEnabled = String(settings.tax_enabled) === '1';
    const taxInclusive = String(settings.tax_inclusive) === '1';
    const taxRate = taxEnabled ? Math.max(0, Number(settings.tax_rate) || 0) : 0;
    const taxFee = taxEnabled ? Math.round(taxable * (taxRate / 100) * 100) / 100 : 0;
    const total = taxInclusive ? Math.max(taxable + shippingFee, 0) : Math.max(taxable + taxFee + shippingFee, 0);

    await conn.beginTransaction();
    const [orderResult] = await conn.query(
      'INSERT INTO orders (user_id, subtotal, shipping_fee, discount, coupon_id, tax_fee, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, subtotal.toFixed(2), shippingFee.toFixed(2), discount.toFixed(2), couponId, taxFee.toFixed(2), total.toFixed(2), 'pending']
    );
    const orderId = orderResult.insertId;

    for (const item of cartRows) {
      await conn.query('INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES (?, ?, ?, ?, ?)', [
        orderId, item.product_id, item.name, item.price, item.quantity,
      ]);
      await conn.query('UPDATE products SET stock = stock - ?, sold = sold + ? WHERE id = ?', [item.quantity, item.quantity, item.product_id]);
    }

    await conn.query(
      `INSERT INTO shipping_info
        (order_id, method_id, method_name, fee, full_name, phone, address_line1, address_line2, city, state, postal_code, country, carrier, service,
         shippo_rate_id, total_product_weight_grams, packaging_weight_grams, parcel_weight_grams, parcel_length_cm, parcel_width_cm, parcel_height_cm, box_name, shipping_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, method.id, method.name, shippingFee.toFixed(2),
        address.full_name, address.phone, address.address_line1, address.address_line2 || null,
        address.city, address.state, address.postal_code, address.country || 'IN',
        shippingCarrier, shippingService || null,
        shippoRateId || null,
        parcel.totalProductWeightGrams, parcel.packagingWeightGrams, parcel.parcelWeightGrams,
        parcel.length_cm, parcel.width_cm, parcel.height_cm, parcel.boxName,
        shippoRateId ? 'rate_selected' : null,
      ]
    );

    await conn.query('DELETE FROM carts WHERE user_id = ?', [req.user.id]);
    await conn.commit();

    invalidateStorefront();
    const createdOrder = await getOrderById(orderId, req.user.id, conn);

    // Trigger Order Confirmation Email
    try {
      const emailSettings = await getCachedSettings();
      if (String(emailSettings.email_order_confirmation ?? '1') === '1') {
        const [uRows] = await pool.query('SELECT email, name FROM users WHERE id = ?', [req.user.id]);
        if (uRows.length > 0 && uRows[0].email) {
          const customerEmail = uRows[0].email;
          const customerName = uRows[0].name || address.full_name || 'Customer';
          const { subject, title, bodyHtml } = buildOrderConfirmationEmail({
            store_name: emailSettings.site_title || emailSettings.store_name || 'Acme Store',
            customer_name: customerName,
            order: createdOrder,
          });
          const sent = await sendMail({ to: customerEmail, subject, title, bodyHtml });
          await pool.query(
            'INSERT INTO email_logs (order_id, type, email, subject, status) VALUES (?, ?, ?, ?, ?)',
            [orderId, 'order_confirmation', customerEmail, subject, sent ? 'sent' : 'failed']
          );
        }
      }
    } catch (mailErr) {
      console.error('[orderController] Order confirmation email error:', mailErr.message);
    }

    res.status(201).json({ order: createdOrder });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

export async function listOrders(req, res, next) {
  try {
    const [orders] = await pool.query(
      `SELECT o.id, o.total, o.subtotal, o.shipping_fee, o.status, o.created_at,
              (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count,
              (SELECT method_name FROM shipping_info si WHERE si.order_id = o.id) AS shipping_method,
              (SELECT p.gateway FROM payments p WHERE p.order_id = o.id ORDER BY p.id DESC LIMIT 1) AS payment_gateway
       FROM orders o
       WHERE o.user_id = ? AND o.deleted_at IS NULL
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

export async function getOrder(req, res, next) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const order = await getOrderById(orderId, req.user.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.shipping?.tracking_number) {
      try {
        await syncTrackingIfStale({
          infoId: order.shipping.id,
          carrier: order.shipping.carrier,
          trackingNumber: order.shipping.tracking_number,
        });
        const fresh = await getOrderById(orderId, req.user.id);
        return res.json({ order: fresh });
      } catch {
        // sync failed — still serve the cached order
      }
    }
    res.json({ order });
  } catch (err) {
    next(err);
  }
}