import { pool } from '../config/db.js';
import { get, set } from '../utils/cache.js';

const TTL_MS = 60_000;

export async function listCategories(req, res, next) {
  try {
    const cached = get('categories:public');
    if (cached) {
      res.setHeader('Cache-Control', `public, max-age=${TTL_MS / 1000}`);
      return res.json(cached);
    }
    const [rows] = await pool.query(
      'SELECT id, name, slug, image FROM categories WHERE deleted_at IS NULL ORDER BY name'
    );
    const payload = { categories: rows };
    set('categories:public', payload, TTL_MS);
    res.setHeader('Cache-Control', `public, max-age=${TTL_MS / 1000}`);
    res.json(payload);
  } catch (err) {
    next(err);
  }
}
