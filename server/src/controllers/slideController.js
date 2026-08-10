import fs from 'fs';
import path from 'path';
import { pool } from '../config/db.js';
import { UPLOAD_DIR } from '../utils/upload.js';
import { get, set, invalidateStorefront } from '../utils/cache.js';

const SELECT = 'SELECT id, title, subtitle, image, link, sort_order, active, created_at FROM slides';
const TTL_MS = 60_000;

function imageUrlFromRequest(req) {
  if (req.file) {
    return `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  }
  if (req.body.image) return req.body.image;
  return null;
}

function deleteUploadedFile(url) {
  if (url && url.includes('/uploads/')) {
    const filename = url.split('/uploads/')[1];
    fs.unlink(path.join(UPLOAD_DIR, filename), () => {});
  }
}

export async function listSlides(req, res, next) {
  try {
    const cached = get('slides:public');
    if (cached) {
      res.setHeader('Cache-Control', `public, max-age=${TTL_MS / 1000}`);
      return res.json(cached);
    }
    const [slides] = await pool.query(
      `${SELECT} WHERE active = 1 AND deleted_at IS NULL ORDER BY sort_order ASC, id ASC`
    );
    const payload = { slides };
    set('slides:public', payload, TTL_MS);
    res.setHeader('Cache-Control', `public, max-age=${TTL_MS / 1000}`);
    res.json(payload);
  } catch (err) {
    next(err);
  }
}

export async function listAdminSlides(req, res, next) {
  try {
    const [slides] = await pool.query(
      `${SELECT} WHERE deleted_at IS NULL ORDER BY sort_order ASC, id ASC`
    );
    res.json({ slides });
  } catch (err) {
    next(err);
  }
}

export async function createSlide(req, res, next) {
  try {
    const { title, subtitle, link } = req.body;
    const image = imageUrlFromRequest(req);
    if (!image) {
      return res.status(400).json({ message: 'Slide image is required' });
    }
    const sortOrder = parseInt(req.body.sort_order, 10) || 0;
    const active = req.body.active === undefined || req.body.active === '1' || req.body.active === 1 ? 1 : 0;

    const [result] = await pool.query(
      'INSERT INTO slides (title, subtitle, image, link, sort_order, active) VALUES (?, ?, ?, ?, ?, ?)',
      [title || null, subtitle || null, image, link || null, sortOrder, active]
    );

    const [rows] = await pool.query(`${SELECT} WHERE id = ?`, [result.insertId]);
    invalidateStorefront();
    res.status(201).json({ slide: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function updateSlide(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [rows] = await pool.query(`${SELECT} WHERE id = ? AND deleted_at IS NULL`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Slide not found' });
    }
    const existing = rows[0];

    const { title, subtitle, link } = req.body;
    const image = imageUrlFromRequest(req) || existing.image;
    const sortOrder = req.body.sort_order !== undefined && req.body.sort_order !== '' ? parseInt(req.body.sort_order, 10) : existing.sort_order;
    const active = req.body.active === undefined || req.body.active === '1' || req.body.active === 1 ? 1 : 0;

    await pool.query(
      'UPDATE slides SET title = ?, subtitle = ?, image = ?, link = ?, sort_order = ?, active = ? WHERE id = ?',
      [
        title !== undefined ? title : existing.title,
        subtitle !== undefined ? subtitle : existing.subtitle,
        image,
        link !== undefined ? link : existing.link,
        sortOrder,
        active,
        id,
      ]
    );

    const [updated] = await pool.query(`${SELECT} WHERE id = ?`, [id]);
    if (image !== existing.image) deleteUploadedFile(existing.image);
    invalidateStorefront();
    res.json({ slide: updated[0] });
  } catch (err) {
    next(err);
  }
}

export async function deleteSlide(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await pool.query(
      'UPDATE slides SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Slide not found' });
    }
    invalidateStorefront();
    res.json({ message: 'Slide deleted' });
  } catch (err) {
    next(err);
  }
}

export async function restoreSlide(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await pool.query('UPDATE slides SET deleted_at = NULL WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Slide not found' });
    }
    invalidateStorefront();
    res.json({ message: 'Slide restored' });
  } catch (err) {
    next(err);
  }
}
