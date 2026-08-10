import { pool } from '../config/db.js';
import { get, set, invalidateStorefront } from '../utils/cache.js';

const TTL_MS = 60_000;

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function uniqueSlug(base) {
  let slug = base;
  let n = 1;
  while (true) {
    const [rows] = await pool.query('SELECT id FROM brands WHERE slug = ?', [slug]);
    if (rows.length === 0) return slug;
    slug = `${base}-${n++}`;
  }
}

const SELECT = 'SELECT id, name, slug, active, created_at FROM brands';

export async function listBrands(req, res, next) {
  try {
    const cached = get('brands:public');
    if (cached) {
      res.setHeader('Cache-Control', `public, max-age=${TTL_MS / 1000}`);
      return res.json(cached);
    }
    const [brands] = await pool.query(
      `${SELECT} WHERE active = 1 AND deleted_at IS NULL ORDER BY name ASC`
    );
    const payload = { brands };
    set('brands:public', payload, TTL_MS);
    res.setHeader('Cache-Control', `public, max-age=${TTL_MS / 1000}`);
    res.json(payload);
  } catch (err) {
    next(err);
  }
}

export async function listAdminBrands(req, res, next) {
  try {
    const [brands] = await pool.query(
      `${SELECT} WHERE deleted_at IS NULL ORDER BY name ASC`
    );
    res.json({ brands });
  } catch (err) {
    next(err);
  }
}

export async function createBrand(req, res, next) {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Brand name is required' });
    }
    const slug = await uniqueSlug(slugify(name));
    const [result] = await pool.query('INSERT INTO brands (name, slug) VALUES (?, ?)', [name, slug]);
    const [rows] = await pool.query(`${SELECT} WHERE id = ?`, [result.insertId]);
    invalidateStorefront();
    res.status(201).json({ brand: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function updateBrand(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Brand name is required' });
    }
    const [rows] = await pool.query('SELECT id, slug FROM brands WHERE id = ? AND deleted_at IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    const existing = rows[0];
    const slug = name === existing.name ? existing.slug : await uniqueSlug(slugify(name));
    const active = req.body.active === undefined || req.body.active === '1' || req.body.active === 1 ? 1 : 0;
    await pool.query('UPDATE brands SET name = ?, slug = ?, active = ? WHERE id = ?', [name, slug, active, id]);
    const [updated] = await pool.query(`${SELECT} WHERE id = ?`, [id]);
    invalidateStorefront();
    res.json({ brand: updated[0] });
  } catch (err) {
    next(err);
  }
}

export async function deleteBrand(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await pool.query(
      'UPDATE brands SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    await pool.query('UPDATE products SET brand_id = NULL WHERE brand_id = ?', [id]);
    invalidateStorefront();
    res.json({ message: 'Brand deleted' });
  } catch (err) {
    next(err);
  }
}

export async function restoreBrand(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await pool.query('UPDATE brands SET deleted_at = NULL WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    invalidateStorefront();
    res.json({ message: 'Brand restored' });
  } catch (err) {
    next(err);
  }
}
