import { pool } from '../config/db.js';
import { resolveCoupon } from '../utils/coupons.js';

const COUPON_FIELDS = 'id, code, type, value, min_order_amount, max_discount, per_user_limit, starts_at, expires_at, active, created_at';

export async function validateCoupon(req, res, next) {
  try {
    const { code } = req.body;
    if (!code || !String(code).trim()) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }
    const subtotal = Number(req.body.subtotal) || 0;
    const result = await resolveCoupon(code, req.user.id, subtotal);
    if (!result) {
      return res.status(400).json({ message: 'Invalid or expired coupon code' });
    }
    const { coupon, discount } = result;
    res.json({
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function adminListCoupons(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM orders o WHERE o.coupon_id = c.id) AS times_used
       FROM coupons c
       ORDER BY c.created_at DESC`
    );
    res.json({ coupons: rows });
  } catch (err) {
    next(err);
  }
}

export async function adminGetCoupon(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [rows] = await pool.query(`SELECT ${COUPON_FIELDS} FROM coupons WHERE id = ?`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    res.json({ coupon: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function adminCreateCoupon(req, res, next) {
  try {
    const b = req.body;
    const [result] = await pool.query(
      `INSERT INTO coupons (code, type, value, min_order_amount, max_discount, per_user_limit, starts_at, expires_at, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(b.code).trim().toUpperCase(),
        b.type,
        Number(b.value) || 0,
        b.min_order_amount === '' || b.min_order_amount == null ? null : Number(b.min_order_amount),
        b.max_discount === '' || b.max_discount == null ? null : Number(b.max_discount),
        b.per_user_limit == null ? 1 : Number(b.per_user_limit),
        b.starts_at || null,
        b.expires_at || null,
        b.active === undefined ? 1 : Number(b.active),
      ]
    );
    res.status(201).json({ coupon: { id: result.insertId } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'A coupon with this code already exists' });
    }
    next(err);
  }
}

export async function adminUpdateCoupon(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const b = req.body;
    const [result] = await pool.query(
      `UPDATE coupons SET
        code = ?, type = ?, value = ?, min_order_amount = ?, max_discount = ?,
        per_user_limit = ?, starts_at = ?, expires_at = ?, active = ?
       WHERE id = ?`,
      [
        String(b.code).trim().toUpperCase(),
        b.type,
        Number(b.value) || 0,
        b.min_order_amount === '' || b.min_order_amount == null ? null : Number(b.min_order_amount),
        b.max_discount === '' || b.max_discount == null ? null : Number(b.max_discount),
        b.per_user_limit == null ? 1 : Number(b.per_user_limit),
        b.starts_at || null,
        b.expires_at || null,
        b.active === undefined ? 1 : Number(b.active),
        id,
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'A coupon with this code already exists' });
    }
    next(err);
  }
}

export async function adminDeleteCoupon(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await pool.query(
      'UPDATE coupons SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function adminRestoreCoupon(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    await pool.query('UPDATE coupons SET deleted_at = NULL WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
