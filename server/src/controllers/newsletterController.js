import { pool } from '../config/db.js';
import { sendMail } from '../services/email.js';
import { getCachedSettings } from '../utils/settingsCache.js';

export async function subscribe(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    await pool.query(
      'INSERT INTO subscribers (email) VALUES (?) ON DUPLICATE KEY UPDATE active = 1',
      [email]
    );
    const settings = await getCachedSettings();
    await sendMail({
      to: email,
      subject: `Welcome to ${settings.site_title || 'our store'}!`,
      title: 'You are subscribed',
      bodyHtml:
        '<p>Thanks for subscribing! You will receive exclusive deals and new arrivals in your inbox.</p>',
    });
    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (err) {
    next(err);
  }
}

export async function unsubscribe(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    await pool.query('UPDATE subscribers SET active = 0 WHERE email = ?', [email]);
    res.json({ message: 'You have been unsubscribed' });
  } catch (err) {
    next(err);
  }
}

export async function adminListSubscribers(req, res, next) {
  try {
    const { search, showInactive } = req.query;
    let where = '1 = 1';
    const params = [];
    if (search) {
      where += ' AND email LIKE ?';
      params.push(`%${search}%`);
    }
    if (showInactive !== '1') {
      where += ' AND active = 1';
    }
    const [rows] = await pool.query(
      `SELECT id, email, active, created_at FROM subscribers WHERE ${where} ORDER BY created_at DESC`,
      params
    );
    res.json({ subscribers: rows });
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteSubscriber(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await pool.query('DELETE FROM subscribers WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Subscriber not found' });
    }
    res.json({ message: 'Subscriber deleted' });
  } catch (err) {
    next(err);
  }
}
