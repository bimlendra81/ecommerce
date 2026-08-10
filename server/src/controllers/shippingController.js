import { pool } from '../config/db.js';
import { getShippingAdapter, loadSettings } from '../services/shipping/index.js';
import { computeWeight, quoteMethods, quoteShippoInternational, applyFreeShipping } from '../services/shipping/quote.js';
import { computeParcel } from '../services/shipping/parcel.js';

export async function listMethods(req, res, next) {
  try {
    const [methods] = await pool.query(
      'SELECT id, name, description, fee, estimated_days_min, estimated_days_max, sort_order FROM shipping_methods WHERE active = 1 ORDER BY sort_order ASC, id ASC'
    );
    const settings = await loadSettings();
    res.json({ methods, provider: settings.shipping_provider || 'manual' });
  } catch (err) {
    next(err);
  }
}

export async function getQuote(req, res, next) {
  try {
    const cartRows = await getCartRows(req.user.id);
    if (cartRows.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }
    const subtotal = cartRows.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

    let destination;
    if (req.body.address_id) {
      const [rows] = await pool.query(
        'SELECT * FROM addresses WHERE id = ? AND user_id = ?',
        [req.body.address_id, req.user.id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Address not found' });
      }
      destination = rows[0];
    } else {
      destination = req.body.shipping_address;
    }

    // Send the customer's real account name to Shippo (recipient on the label),
    // not just whatever was typed into the shipping-address name field.
    const [userRows] = await pool.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
    if (destination && userRows[0]?.name) destination = { ...destination, user_name: userRows[0].name };

    const settings = await loadSettings();
    const { adapter, provider, configured } = await getShippingAdapter();
    const weight = await computeWeight({ items: cartRows, settings });
    const parcel = computeParcel({ items: cartRows, settings });
    const [methods] = await pool.query(
      'SELECT id, name, description, fee, estimated_days_min, estimated_days_max FROM shipping_methods WHERE active = 1 ORDER BY sort_order ASC, id ASC'
    );

    let quotes = await quoteMethods({ methods, weight, destination, adapter, settings });

    // Shippo live rates: append EACH carrier service as a selectable quote with rate_id.
    if (provider === 'shippo') {
      const origin = await loadSettings();
      const originCountry = (origin.shipping_origin_country || 'IN');
      const destCountry = (destination.country || '').toUpperCase();
      const isIntl = String(originCountry).toUpperCase() !== String(destCountry).toUpperCase();

      if (isIntl && adapter.listRates) {
        try {
          const rates = await adapter.listRates({ parcel, destination, settings, items: cartRows, amount: subtotal });
          for (const r of rates) {
            quotes.push({
              method_id: -Math.abs(r.rate_id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)),
              name: `Shippo · ${r.carrier}`,
              description: `Live rate · ${r.currency} ${r.amount}`,
              fee: Number(r.amount),
              estimated_days_min: r.estimated_days_min,
              estimated_days_max: r.estimated_days_max,
              carrier: r.carrier,
              service: r.service,
              provider: 'shippo',
              currency: r.currency,
              shippo_rate_id: r.rate_id,
            });
          }
        } catch (err) {
          const intl = await quoteShippoInternational({ adapter, weight, destination, settings });
          if (intl) quotes.push({ ...intl, rate_error: err.message || 'Live rate unavailable' });
        }
      } else {
        const intl = await quoteShippoInternational({ adapter, weight, destination, settings });
        if (intl) quotes.push(intl);
      }
    }

    quotes = applyFreeShipping(quotes, subtotal, settings.free_shipping_threshold);

    res.json({
      subtotal: Number(subtotal.toFixed(2)),
      weight,
      parcel,
      provider,
      configured,
      quotes,
    });
  } catch (err) {
    next(err);
  }
}

async function getCartRows(userId) {
  const [rows] = await pool.query(
    `SELECT ci.product_id, ci.quantity, p.name, p.price, p.stock, p.weight_grams,
            p.length_cm, p.width_cm, p.height_cm, p.dimension_unit
     FROM carts ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = ? AND p.deleted_at IS NULL`,
    [userId]
  );
  return rows;
}