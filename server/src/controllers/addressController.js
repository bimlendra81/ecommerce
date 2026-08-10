import { pool } from '../config/db.js';

export async function listAddresses(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );
    res.json({ addresses: rows });
  } catch (err) {
    next(err);
  }
}

export async function createAddress(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default } = req.body;
    await conn.beginTransaction();
    if (is_default) {
      await conn.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }
    const [result] = await conn.query(
      `INSERT INTO addresses (user_id, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        full_name,
        phone,
        address_line1,
        address_line2 || null,
        city,
        state,
        postal_code,
        country || 'IN',
        is_default ? 1 : 0,
      ]
    );
    await conn.commit();
    const [rows] = await conn.query('SELECT * FROM addresses WHERE id = ?', [result.insertId]);
    res.status(201).json({ address: rows[0] });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

export async function updateAddress(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const id = parseInt(req.params.id, 10);
    const [rows] = await conn.query(
      'SELECT id FROM addresses WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Address not found' });
    }
    const { full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default } = req.body;
    await conn.beginTransaction();
    if (is_default) {
      await conn.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }
    await conn.query(
      `UPDATE addresses
       SET full_name = ?, phone = ?, address_line1 = ?, address_line2 = ?, city = ?, state = ?, postal_code = ?, country = ?, is_default = ?
       WHERE id = ?`,
      [
        full_name,
        phone,
        address_line1,
        address_line2 || null,
        city,
        state,
        postal_code,
        country || 'IN',
        is_default ? 1 : 0,
        id,
      ]
    );
    await conn.commit();
    const [updated] = await conn.query('SELECT * FROM addresses WHERE id = ?', [id]);
    res.json({ address: updated[0] });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

export async function deleteAddress(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await pool.query(
      'DELETE FROM addresses WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Address not found' });
    }
    res.json({ message: 'Address deleted' });
  } catch (err) {
    next(err);
  }
}
