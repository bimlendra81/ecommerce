import { pool } from '../config/db.js';
import { getShippingAdapter, loadSettings, saveSetting, PROVIDER_LABELS } from '../services/shipping/index.js';
import { computeWeight } from '../services/shipping/quote.js';
import { syncTrackingIfStale } from '../services/shipping/tracking.js';

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

// ---- Shipping methods CRUD ----

export async function listAdminShippingMethods(req, res, next) {
  try {
    const [methods] = await pool.query(
      'SELECT * FROM shipping_methods ORDER BY sort_order ASC, id ASC'
    );
    const settings = await loadSettings();
    res.json({ methods, provider: settings.shipping_provider || 'manual' });
  } catch (err) {
    next(err);
  }
}

export async function createShippingMethod(req, res, next) {
  try {
    const { name, description, fee, estimated_days_min, estimated_days_max, active, sort_order } = req.body;
    const [result] = await pool.query(
      `INSERT INTO shipping_methods (name, description, fee, estimated_days_min, estimated_days_max, active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        round2(fee || 0),
        estimated_days_min != null ? estimated_days_min : null,
        estimated_days_max != null ? estimated_days_max : null,
        active === undefined || active === '1' || active === 1 || active === true ? 1 : 0,
        sort_order != null ? sort_order : 0,
      ]
    );
    const [rows] = await pool.query('SELECT * FROM shipping_methods WHERE id = ?', [result.insertId]);
    res.status(201).json({ method: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function updateShippingMethod(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [rows] = await pool.query('SELECT * FROM shipping_methods WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Shipping method not found' });
    }
    const existing = rows[0];
    const { name, description, fee, estimated_days_min, estimated_days_max, active, sort_order } = req.body;
    await pool.query(
      `UPDATE shipping_methods
       SET name = ?, description = ?, fee = ?, estimated_days_min = ?, estimated_days_max = ?, active = ?, sort_order = ?
       WHERE id = ?`,
      [
        name !== undefined ? name : existing.name,
        description !== undefined ? description : existing.description,
        fee !== undefined ? round2(fee) : existing.fee,
        estimated_days_min !== undefined && estimated_days_min !== ''
          ? estimated_days_min
          : existing.estimated_days_min,
        estimated_days_max !== undefined && estimated_days_max !== ''
          ? estimated_days_max
          : existing.estimated_days_max,
        active === undefined || active === '1' || active === 1 || active === true ? 1 : 0,
        sort_order !== undefined ? sort_order : existing.sort_order,
        id,
      ]
    );
    const [updated] = await pool.query('SELECT * FROM shipping_methods WHERE id = ?', [id]);
    res.json({ method: updated[0] });
  } catch (err) {
    next(err);
  }
}

export async function deleteShippingMethod(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await pool.query('DELETE FROM shipping_methods WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Shipping method not found' });
    }
    res.json({ message: 'Shipping method deleted' });
  } catch (err) {
    next(err);
  }
}

// ---- Order shipping actions ----

async function getOrderWithShipping(orderId) {
  const [rows] = await pool.query(
    `SELECT o.id, o.user_id, o.total, o.subtotal, o.shipping_fee, o.status, o.created_at,
            u.name AS user_name, u.email AS user_email
     FROM orders o JOIN users u ON u.id = o.user_id
     WHERE o.id = ? AND o.deleted_at IS NULL`,
    [orderId]
  );
  if (rows.length === 0) return null;
  const order = rows[0];
  const [items] = await pool.query(
    'SELECT oi.id, oi.product_id, oi.name, oi.price, oi.quantity, p.weight_grams FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?',
    [orderId]
  );
  const [infoRows] = await pool.query('SELECT * FROM shipping_info WHERE order_id = ?', [orderId]);
  let info = infoRows[0] || null;
  if (info) {
    const [events] = await pool.query(
      'SELECT id, event, location, notes, created_at FROM shipping_events WHERE shipping_info_id = ? ORDER BY created_at ASC, id ASC',
      [info.id]
    );
    info = { ...info, events };
  }
  return { order: { ...order, items }, info };
}

async function getShippingInfoId(orderId) {
  const [rows] = await pool.query('SELECT id FROM shipping_info WHERE order_id = ?', [orderId]);
  return rows[0]?.id || null;
}

export async function updateOrderShipping(req, res, next) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const data = await getOrderWithShipping(orderId);
    if (!data) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const { carrier, tracking_number, tracking_url, notes, estimated_delivery } = req.body;
    const infoId = await getShippingInfoId(orderId);
    if (!infoId) {
      return res.status(400).json({ message: 'Order has no shipping info yet' });
    }
    await pool.query(
      `UPDATE shipping_info
       SET carrier = COALESCE(?, carrier),
           tracking_number = COALESCE(?, tracking_number),
           tracking_url = COALESCE(?, tracking_url),
           notes = COALESCE(?, notes),
           estimated_delivery = COALESCE(?, estimated_delivery)
       WHERE id = ?`,
      [carrier || null, tracking_number || null, tracking_url || null, notes || null, estimated_delivery || null, infoId]
    );
    res.json({ message: 'Shipping info updated' });
  } catch (err) {
    next(err);
  }
}

export async function createOrderShipment(req, res, next) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const data = await getOrderWithShipping(orderId);
    if (!data) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const { order, info } = data;
    if (!info) {
      return res.status(400).json({ message: 'Order has no shipping info yet' });
    }
    const { adapter, provider, configured } = await getShippingAdapter();
    if (!configured) {
      return res.status(400).json({
        message: `Provider "${PROVIDER_LABELS[provider] || provider}" is not configured. Add credentials in Admin > Shipping.`,
      });
    }
    const settings = await loadSettings();
    const weight = await computeWeight({ items: order.items, settings });

    const result = await adapter.createShipment({
      order: { ...order, weight, user_email: order.user_email, user_name: order.user_name },
      info: { ...info, user_name: order.user_name },
      items: order.items,
      settings,
    });

    const infoId = await getShippingInfoId(orderId);
    await pool.query(
      `UPDATE shipping_info
       SET carrier = ?, tracking_number = ?, tracking_url = ?, shipped_at = IFNULL(shipped_at, NOW())
       WHERE id = ?`,
      [result.carrier, result.tracking_number, result.tracking_url, infoId]
    );
    await pool.query("UPDATE orders SET status = 'shipped' WHERE id = ? AND status IN ('paid','pending')", [orderId]);
    if (order.status !== 'shipped') {
      await pool.query(
        'INSERT INTO shipping_events (shipping_info_id, event, location, notes) VALUES (?, ?, ?, ?)',
        [infoId, 'Order shipped', '', 'Order status set to shipped']
      );
    }
    for (const ev of result.events || []) {
      await pool.query(
        'INSERT INTO shipping_events (shipping_info_id, event, location, notes) VALUES (?, ?, ?, ?)',
        [infoId, ev.event, ev.location || '', ev.notes || '']
      );
    }

    // Trigger Shipment Created Email
    try {
      const emailSettings = await getCachedSettings();
      if (String(emailSettings.email_shipment_created ?? '1') === '1' && order.user_email) {
        const { subject, title, bodyHtml } = buildShipmentCreatedEmail({
          store_name: emailSettings.site_title || emailSettings.store_name || 'Acme Store',
          customer_name: order.user_name || 'Customer',
          order,
          shipment: {
            carrier: result.carrier,
            tracking_number: result.tracking_number,
            tracking_url: result.tracking_url,
            estimated_delivery: info.estimated_delivery,
          },
        });
        const sent = await sendMail({ to: order.user_email, subject, title, bodyHtml });
        await pool.query('INSERT INTO email_logs (order_id, type, email, subject, status) VALUES (?, ?, ?, ?, ?)', [
          orderId, 'shipment_created', order.user_email, subject, sent ? 'sent' : 'failed'
        ]);
      }
    } catch (mailErr) {
      console.error('[adminShippingController] Shipment created email error:', mailErr.message);
    }

    res.json({ message: 'Shipment created', result });
  } catch (err) {
    next(err);
  }
}

export async function syncOrderTracking(req, res, next) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const data = await getOrderWithShipping(orderId);
    if (!data) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (!data.info?.tracking_number) {
      return res.status(400).json({ message: 'No tracking number to sync' });
    }
    const result = await syncTrackingIfStale({
      infoId: data.info.id,
      carrier: data.info.carrier,
      trackingNumber: data.info.tracking_number,
      force: true,
    });
    res.json({ message: 'Tracking synced', added: result.synced ? result.added || 0 : 0, reason: result.reason });
  } catch (err) {
    next(err);
  }
}

export async function addShippingEvent(req, res, next) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const infoId = await getShippingInfoId(orderId);
    if (!infoId) {
      return res.status(400).json({ message: 'Order has no shipping info yet' });
    }
    const { event, location, notes } = req.body;
    const [result] = await pool.query(
      'INSERT INTO shipping_events (shipping_info_id, event, location, notes) VALUES (?, ?, ?, ?)',
      [infoId, event, location || '', notes || '']
    );
    const [rows] = await pool.query('SELECT * FROM shipping_events WHERE id = ?', [result.insertId]);
    res.status(201).json({ event: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function buyShippingLabel(req, res, next) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const data = await getOrderWithShipping(orderId);
    if (!data) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (!data.info) {
      return res.status(400).json({ message: 'Order has no shipping info yet' });
    }
    if (data.info.shipping_status === 'label_created' && data.info.label_url) {
      return res.json({ message: 'Shipping label already created', label: data.info });
    }
    const { adapter } = await getShippingAdapter();
    if (!adapter || adapter.name !== 'shippo' || !adapter.buyLabel || !adapter.isConfigured()) {
      return res.status(400).json({ message: 'Shippo is not configured. Add an API token in Admin > Shipping.' });
    }
    const settings = await loadSettings();

    let result;
    if (data.info.shippo_rate_id) {
      let rateId = data.info.shippo_rate_id;
      if (data.info.parcel_override) {
        let override = null;
        try {
          override = typeof data.info.parcel_override === 'string' ? JSON.parse(data.info.parcel_override) : data.info.parcel_override;
        } catch {}
        if (override && adapter.listRates) {
          const parcel = {
            length_cm: Number(override.length_cm) || 0,
            width_cm: Number(override.width_cm) || 0,
            height_cm: Number(override.height_cm) || 0,
            parcelWeightGrams: Number(override.weight_grams) || 0,
          };
          const dest = {
            full_name: data.info.full_name,
            address_line1: data.info.address_line1,
            address_line2: data.info.address_line2,
            city: data.info.city,
            state: data.info.state,
            postal_code: data.info.postal_code,
            country: data.info.country,
            phone: data.info.phone,
            user_name: data.order.user_name,
          };
          const rates = await adapter.listRates({ parcel, destination: dest, settings });
          const same = rates.find((r) => r.rate_id === data.info.shippo_rate_id);
          if (same) rateId = same.rate_id;
          else if (rates.length > 0) rateId = rates[0].rate_id;
        }
      }
      result = await adapter.buyLabel({
        rate_id: rateId,
        label_file_type: settings.shippo_label_file_type || 'PDF',
      });
    } else if (data.info.carrier === 'shippo' && adapter.createAndBuyLabel) {
      // "Shippo (International)" fallback method — no stored rate. Build the shipment
      // (with customs if international) and buy the cheapest live rate.
      const weight = await computeWeight({ items: data.order.items, settings });
      result = await adapter.createAndBuyLabel({
        order: { ...data.order, weight },
        info: { ...data.info, user_name: data.order.user_name },
        items: data.order.items,
        settings,
      });
    } else {
      return res.status(400).json({ message: 'Order has no Shippo rate selected' });
    }
    const infoId = data.info.id;
    await pool.query(
      'UPDATE shipping_info SET shippo_rate_id = COALESCE(?, shippo_rate_id), shippo_transaction_id = ?, tracking_number = ?, tracking_url = ?, label_url = ?, carrier = ?, service = ?, shipping_status = ?, shipping_error = NULL WHERE id = ?',
      [result.rate_id, result.object_id, result.tracking_number, result.tracking_url, result.label_url, result.carrier, result.service, 'label_created', infoId]
    );
    await pool.query(
      "INSERT INTO shipping_events (shipping_info_id, event, location, notes) VALUES (?, 'Label created', '', ?)",
      [infoId, `Label ${result.carrier ? `via ${result.carrier}` : 'purchased'} · ${result.tracking_number || 'tracking pending'}`.slice(0, 255)]
    );
    res.json({ message: 'Shipping label created', label: result });
  } catch (err) {
    const msg = (err && err.message ? err.message : 'Label creation failed').slice(0, 255);
    try {
      const infoId = await getShippingInfoId(parseInt(req.params.id, 10));
      if (infoId) {
        await pool.query(
          "UPDATE shipping_info SET shipping_status = 'error', shipping_error = ? WHERE id = ? AND shipping_status != 'label_created'",
          [msg, infoId]
        );
      }
    } catch {}
    next(err);
  }
}

export async function updateOrderParcel(req, res, next) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const infoId = await getShippingInfoId(orderId);
    if (!infoId) {
      return res.status(400).json({ message: 'Order has no shipping info yet' });
    }
    const { length_cm, width_cm, height_cm, weight_grams } = req.body;
    const override = {
      length_cm: Number(length_cm) || null,
      width_cm: Number(width_cm) || null,
      height_cm: Number(height_cm) || null,
      weight_grams: Number(weight_grams) || null,
    };
    if (!override.length_cm && !override.width_cm && !override.height_cm && !override.weight_grams) {
      return res.status(400).json({ message: 'Provide at least one of length_cm, width_cm, height_cm or weight_grams' });
    }
    await pool.query('UPDATE shipping_info SET parcel_override = ? WHERE id = ?', [JSON.stringify(override), infoId]);
    const [rows] = await pool.query('SELECT id, parcel_override FROM shipping_info WHERE id = ?', [infoId]);
    res.json({ message: 'Parcel override saved. Re-purchase the label to apply it.', parcel_override: rows[0].parcel_override });
  } catch (err) {
    next(err);
  }
}

export async function getShippingConfig(req, res, next) {
  try {
    const settings = await loadSettings();
    res.json({
      provider: settings.shipping_provider || 'manual',
      configured: {
        shiprocket: Boolean(settings.shiprocket_token || (settings.shiprocket_email && settings.shiprocket_password)),
        delhivery: Boolean(settings.delhivery_api_token),
        shippo: Boolean(settings.shippo_token),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateShippingConfig(req, res, next) {
  try {
    const allowed = [
      'shipping_provider',
      'default_weight_grams',
      'shipping_origin_name',
      'shipping_origin_street1',
      'shipping_origin_street2',
      'shipping_origin_city',
      'shipping_origin_state',
      'shipping_origin_postcode',
      'shipping_origin_country',
      'shipping_origin_email',
      'shipping_origin_phone',
      'shipping_boxes',
      'shipping_clearance_factor',
      'shippo_label_file_type',
      'shiprocket_email',
      'shiprocket_password',
      'delhivery_api_token',
      'delhivery_client_name',
      'shippo_token',
    ];
    for (const key of Object.keys(req.body)) {
      if (allowed.includes(key)) {
        await saveSetting(key, req.body[key] ?? '');
      }
    }
    if (req.body.shiprocket_password) {
      await saveSetting('shiprocket_token', '');
    }
    const settings = await loadSettings();
    res.json({
      message: 'Shipping configuration saved',
      provider: settings.shipping_provider || 'manual',
    });
  } catch (err) {
    next(err);
  }
}

// export async function testShippo(req, res, next) {
//   try {
//     const settings = await loadSettings();
//     if (!settings.shippo_token) {
//       return res.status(400).json({ message: 'Add a Shippo API token first.' });
//     }
//     const { adapter } = await getShippingAdapter();
//     if (adapter.name !== 'shippo') {
//       return res.status(400).json({ message: 'Shipping provider is not Shippo.' });
//     }
//     const testAddress = {
//       name: 'Test Customer',
//       street1: '1600 Pennsylvania Avenue NW',
//       city: 'Washington',
//       state: 'DC',
//       zip: '20500',
//       country: 'US'
//     };
//     const result = await adapter.rateFor({
//       weight: 1000,
//       destination: testAddress,
//       method: { name: 'Standard Shipping' },
//     });
//     if (result?.error) {
//       return res.status(502).json({ ok: false, error: result.error });
//     }
//     res.json({ ok: true, result });
//   } catch (err) {
//     res.status(500).json({ ok: false, error: err.message });
//   }
// }




export async function testShippo(req, res, next) {
  try {
    const settings = await loadSettings();

    if (!settings.shippo_token) {
      return res.status(400).json({
        ok: false,
        message: 'Add a Shippo API token first.'
      });
    }

    const { adapter } = await getShippingAdapter();

    if (!adapter || adapter.name !== 'shippo') {
      return res.status(400).json({
        ok: false,
        message: 'Shipping provider is not Shippo.'
      });
    }

    // Test origin address
    const originAddress = {
      name: 'Test Sender',
      street1: '215 Clayton St',
      city: 'San Francisco',
      state: 'CA',
      zip: '94117',
      country: 'US'
    };

    // Test destination address
    const destinationAddress = {
      name: 'Test Customer',
      street1: '1600 Pennsylvania Avenue NW',
      city: 'Washington',
      state: 'DC',
      zip: '20500',
      country: 'US'
    };

    // Test shipment data
    const shipmentData = {
      weight: 1000,
      origin: originAddress,
      destination: destinationAddress,
      method: {
        name: 'Standard Shipping'
      }
    };

    console.log('========== SHIPPO TEST ==========');
    console.log('Adapter:', adapter.name);
    console.log('Request:', JSON.stringify(shipmentData, null, 2));
    console.log('==================================');

    const result = await adapter.rateFor(shipmentData);

    console.log(
      'Shippo adapter result:',
      JSON.stringify(result, null, 2)
    );

    if (result?.error) {
      return res.status(502).json({
        ok: false,
        error: result.error,
        debug: {
          adapter: adapter.name,
          origin: originAddress,
          destination: destinationAddress
        }
      });
    }

    return res.status(200).json({
      ok: true,
      result
    });

  } catch (err) {
    console.error('========== SHIPPO TEST ERROR ==========');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    console.error('Response:', err.response?.data);
    console.error('Status:', err.response?.status);
    console.error('========================================');

    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
}

