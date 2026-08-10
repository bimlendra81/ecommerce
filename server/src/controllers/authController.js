import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { signToken } from '../config/jwt.js';
import { sendMail } from '../services/email.js';
import { getCachedSettings } from '../utils/settingsCache.js';

export async function register(req, res, next) {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone || null, passwordHash, 'user']
    );

    const token = signToken({ id: result.insertId, role: 'user' });

    res.status(201).json({
      message: 'User registered',
      token,
      user: { id: result.insertId, name, email, phone: phone || null, role: 'user' },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    if (user.active === 0) {
      return res.status(403).json({ message: 'Account is disabled. Contact support.' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, avatar, created_at FROM users WHERE id = ? AND deleted_at IS NULL',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { name, phone } = req.body;
    const avatar = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : null;

    await pool.query(
      'UPDATE users SET name = ?, phone = ?, avatar = COALESCE(?, avatar) WHERE id = ? AND deleted_at IS NULL',
      [name, phone || null, avatar, req.user.id]
    );

    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    const [result] = await pool.query(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ? AND deleted_at IS NULL',
      [token, expires, email]
    );

    if (result.affectedRows > 0) {
      const base = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
      const link = `${base}/reset-password?token=${token}`;
      const settings = await getCachedSettings();
      await sendMail({
        to: email,
        subject: `Reset your password — ${settings.site_title || 'our store'}`,
        title: 'Password reset',
        bodyHtml: `<p>We received a request to reset your password.</p>
          <p style="margin:24px 0;"><a href="${link}" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">Reset password</a></p>
          <p>Or paste this link into your browser:<br><code style="word-break:break-all;">${link}</code></p>
          <p>This link expires in 1 hour. If you didn't request it, you can safely ignore this email.</p>`,
      });
    }

    res.json({ message: 'If an account exists for this email, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW() AND deleted_at IS NULL',
      [token]
    );
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset link' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [passwordHash, rows[0].id]
    );

    res.json({ message: 'Password updated. You can now log in.' });
  } catch (err) {
    next(err);
  }
}
