import { pool } from '../../config/db.js';
import { getShippingAdapter, loadSettings } from './index.js';

// Called ONLY after payment success (server-side/webhook) — never on rate view.
export async function createShippingLabelAfterPayment(orderId, conn = pool) {
  try {
    const [infoRows] = await conn.query('SELECT * FROM shipping_info WHERE order_id = ?', [orderId]);
    const info = infoRows[0];

    if (!info) return null;
    if (info.shipping_status === 'label_created' && info.label_url) return info;

    const settings = await loadSettings();
    const { adapter } = await getShippingAdapter();
    if (!adapter || adapter.name !== 'shippo' || !adapter.buyLabel || !adapter.isConfigured()) return null;

    // Send the customer's real account name to Shippo (recipient on the label).
    const [userRows] = await conn.query(
      `SELECT u.name AS user_name FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ?`,
      [orderId]
    );
    const infoWithName = { ...info, user_name: userRows[0]?.user_name };

    let result;
    if (info.shippo_rate_id) {
      result = await buyWithStoredRate({ adapter, info: infoWithName, settings });
    } else if (info.carrier === 'shippo' && adapter.createAndBuyLabel) {
      // "Shippo (International)" fallback method — no rate was stored at checkout.
      // Build the shipment now (with customs if international) and buy the cheapest live rate.
      const [orderRows] = await conn.query('SELECT * FROM orders WHERE id = ?', [orderId]);
      const [items] = await conn.query(
        'SELECT name AS product_name, quantity, price FROM order_items WHERE order_id = ?',
        [orderId]
      );
      result = await adapter.createAndBuyLabel({ order: orderRows[0], info: infoWithName, items, settings });
    } else {
      return null;
    }

    await conn.query(
      'UPDATE shipping_info SET shippo_rate_id = COALESCE(?, shippo_rate_id), shippo_transaction_id = ?, tracking_number = ?, tracking_url = ?, label_url = ?, carrier = ?, service = ?, shipping_status = ?, shipping_error = NULL WHERE order_id = ?',
      [result.rate_id, result.object_id, result.tracking_number, result.tracking_url, result.label_url, result.carrier, result.service, 'label_created', orderId]
    );
    const infoId = info.id;
    await conn.query(
      "INSERT INTO shipping_events (shipping_info_id, event, location, notes) VALUES (?, 'Label created', '', ?)",
      [infoId, `Label ${result.carrier ? `via ${result.carrier}` : 'purchased'} · ${result.tracking_number || 'tracking pending'}`.slice(0, 255)]
    );
    const [updated] = await conn.query('SELECT * FROM shipping_info WHERE order_id = ?', [orderId]);
    return updated[0] || null;
  } catch (err) {
    // Do not fail the payment; record the error so admin can retry.
    const msg = (err && err.message ? err.message : 'Label creation failed').slice(0, 255);
    try {
      await conn.query(
        "UPDATE shipping_info SET shipping_status = 'error', shipping_error = ? WHERE order_id = ? AND shipping_status != 'label_created'",
        [msg, orderId]
      );
    } catch {}
    return null;
  }
}

async function buyWithStoredRate({ adapter, info, settings }) {
  // Optional admin parcel override (box, dims, weight) applied before buying the label.
  let rateId = info.shippo_rate_id;
  if (info.parcel_override) {
    let override = null;
    try {
      override = typeof info.parcel_override === 'string' ? JSON.parse(info.parcel_override) : info.parcel_override;
    } catch {}
    if (override && (override.length_cm || override.width_cm || override.height_cm || override.weight_grams)) {
      // Re-run rates against the override parcel and re-select the same rate_id if
      // available; otherwise fall back to the cheapest live rate.
      if (adapter.listRates) {
        const dest = {
          full_name: info.full_name,
          address_line1: info.address_line1,
          address_line2: info.address_line2,
          city: info.city,
          state: info.state,
          postal_code: info.postal_code,
          country: info.country,
          phone: info.phone,
          email: '',
          user_name: info.user_name,
        };
        const parcel = {
          length_cm: Number(override.length_cm) || 0,
          width_cm: Number(override.width_cm) || 0,
          height_cm: Number(override.height_cm) || 0,
          parcelWeightGrams: Number(override.weight_grams) || 0,
        };
        const rates = await adapter.listRates({ parcel, destination: dest, settings });
        const same = rates.find((r) => r.rate_id === info.shippo_rate_id);
        if (same) rateId = same.rate_id;
        else if (rates.length > 0) rateId = rates[0].rate_id;
      }
    }
  }

  const labelFileType = settings.shippo_label_file_type || 'PDF';
  return adapter.buyLabel({ rate_id: rateId, label_file_type: labelFileType });
}
