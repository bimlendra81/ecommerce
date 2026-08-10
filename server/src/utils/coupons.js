import { pool } from '../config/db.js';

export async function resolveCoupon(code, userId, subtotal) {
  if (!code) return null;
  const [rows] = await pool.query(
    'SELECT * FROM coupons WHERE code = ? AND active = 1 AND deleted_at IS NULL',
    [code.trim().toUpperCase()]
  );
  if (rows.length === 0) return null;
  const c = rows[0];
  const now = new Date();
  if (c.starts_at && new Date(c.starts_at) > now) return null;
  if (c.expires_at && new Date(c.expires_at) < now) return null;
  if (c.min_order_amount != null && subtotal < Number(c.min_order_amount)) return null;

  const [usage] = await pool.query(
    'SELECT COUNT(*) AS n FROM orders WHERE coupon_id = ? AND user_id = ? AND deleted_at IS NULL',
    [c.id, userId]
  );
  if (Number(usage[0].n) >= Number(c.per_user_limit)) return null;

  let discount = 0;
  if (c.type === 'percent') {
    discount = subtotal * (Number(c.value) / 100);
    if (c.max_discount != null && discount > Number(c.max_discount)) {
      discount = Number(c.max_discount);
    }
  } else {
    discount = Number(c.value);
  }
  discount = Math.min(discount, subtotal);
  discount = Math.round(discount * 100) / 100;

  return { coupon: c, discount };
}
