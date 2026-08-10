import { pool } from '../config/db.js';
import { get, set } from '../utils/cache.js';

const HOME_TTL_MS = 60_000;

async function getProductsByIds(productIds) {
  if (productIds.length === 0) return [];
  const [products] = await pool.query(
    `SELECT p.id, p.name, p.slug, p.price, p.stock, p.image, p.category_id, p.brand_id,
            p.sold,
            c.name AS category, c.slug AS category_slug, b.name AS brand,
            (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.product_id = p.id AND r.approved = 1) AS rating_avg,
            (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.approved = 1) AS rating_count
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id
     WHERE p.id IN (?) AND p.active = 1 AND p.deleted_at IS NULL`,
    [productIds]
  );
  const mediaMap = {};
  if (products.length > 0) {
    const [mediaRows] = await pool.query(
      'SELECT product_id, type, url FROM product_media WHERE product_id IN (?) ORDER BY sort_order ASC, id ASC',
      [productIds]
    );
    for (const m of mediaRows) {
      if (!mediaMap[m.product_id]) mediaMap[m.product_id] = [];
      mediaMap[m.product_id].push(m);
    }
  }
  return products.map((p) => ({ ...p, media: mediaMap[p.id] || [] }));
}

async function getRecommendedForUser(userId) {
  const [rows] = await pool.query(
    `SELECT p.id, p.category_id FROM products p
     WHERE (EXISTS (
       SELECT 1 FROM carts c WHERE c.user_id = ? AND c.product_id = p.id
     ) OR EXISTS (
       SELECT 1 FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.user_id = ? AND oi.product_id = p.id AND o.status <> 'cancelled' AND o.deleted_at IS NULL
     )) AND p.active = 1 AND p.deleted_at IS NULL
     LIMIT 200`,
    [userId, userId]
  );

  const categoryIds = [...new Set(rows.map((r) => r.category_id).filter(Boolean))];
  const ownedIds = rows.map((r) => r.id);
  if (categoryIds.length === 0) return [];

  const [candidates] = await pool.query(
    `SELECT p.id
     FROM products p
     WHERE p.category_id IN (?)
       AND p.active = 1 AND p.deleted_at IS NULL
       AND p.id NOT IN (?)
     ORDER BY p.sold DESC, p.created_at DESC
     LIMIT 8`,
    [categoryIds, ownedIds]
  );

  return getProductsByIds(candidates.map((c) => c.id));
}

async function buildHome(userId) {
  const [slides] = await pool.query(
    'SELECT id, title, subtitle, image, link FROM slides WHERE active = 1 AND deleted_at IS NULL ORDER BY sort_order ASC, id ASC'
  );

  const [products] = await pool.query(
    `SELECT p.id, p.name, p.slug, p.price, p.sale_price, p.sale_ends_at, p.stock, p.image, p.category_id, p.brand_id,
            p.sold,
            c.name AS category, c.slug AS category_slug, b.name AS brand,
            (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.product_id = p.id AND r.approved = 1) AS rating_avg,
            (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.approved = 1) AS rating_count
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id
     WHERE p.active = 1 AND p.deleted_at IS NULL
     ORDER BY p.sold DESC, p.created_at DESC
     LIMIT 8`
  );
  const productIds = products.map((p) => p.id);
  const mediaMap = {};
  if (productIds.length > 0) {
    const [mediaRows] = await pool.query(
      'SELECT product_id, type, url FROM product_media WHERE product_id IN (?) ORDER BY sort_order ASC, id ASC',
      [productIds]
    );
    for (const m of mediaRows) {
      if (!mediaMap[m.product_id]) mediaMap[m.product_id] = [];
      mediaMap[m.product_id].push(m);
    }
  }
  const popularProducts = products.map((p) => ({ ...p, media: mediaMap[p.id] || [] }));

  const [categories] = await pool.query(
    `SELECT c.id, c.name, c.slug, c.image, c.featured, c.featured_order,
            (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.active = 1 AND p.deleted_at IS NULL) AS product_count,
            (SELECT COALESCE(SUM(p2.sold), 0) FROM products p2 WHERE p2.category_id = c.id AND p2.active = 1 AND p2.deleted_at IS NULL) AS sold
     FROM categories c
     WHERE c.deleted_at IS NULL
     ORDER BY c.name`
  );

  const [trendingCategories] = await pool.query(
    `SELECT c.id, c.name, c.slug, c.image,
            (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.active = 1 AND p.deleted_at IS NULL) AS product_count,
            (SELECT COALESCE(SUM(p2.sold), 0) FROM products p2 WHERE p2.category_id = c.id AND p2.active = 1 AND p2.deleted_at IS NULL) AS sold
     FROM categories c
     WHERE c.deleted_at IS NULL
     ORDER BY sold DESC, c.name ASC
     LIMIT 6`
  );

  const [featuredCategories] = await pool.query(
    `SELECT c.id, c.name, c.slug, c.image, c.featured_order,
            (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.active = 1 AND p.deleted_at IS NULL) AS product_count
     FROM categories c
     WHERE c.deleted_at IS NULL AND c.featured = 1
     ORDER BY c.featured_order ASC, c.id ASC`
  );

  const recommended = userId ? await getRecommendedForUser(userId) : [];

  return { slides, popularProducts, categories, trendingCategories, featuredCategories, recommended };
}

export async function getHome(req, res, next) {
  try {
    const userId = req.user ? req.user.id : null;
    const cacheKey = `home:${userId || 'anon'}`;
    const cached = get(cacheKey);
    if (cached) {
      res.setHeader('Cache-Control', `public, max-age=${HOME_TTL_MS / 1000}`);
      return res.json(cached);
    }
    const payload = await buildHome(userId);
    set(cacheKey, payload, HOME_TTL_MS);
    res.setHeader('Cache-Control', `public, max-age=${HOME_TTL_MS / 1000}`);
    res.json(payload);
  } catch (err) {
    next(err);
  }
}
