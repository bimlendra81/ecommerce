import { pool } from '../config/db.js';

async function getWishlistItems(userId) {
  const [rows] = await pool.query(
    `SELECT w.product_id, w.created_at, p.name, p.slug, p.price, p.sale_price, p.sale_ends_at, p.stock, p.image,
            p.category_id, p.brand_id, p.return_days,
            c.name AS category, c.slug AS category_slug, b.name AS brand,
            (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.product_id = p.id AND r.approved = 1) AS rating_avg,
            (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.approved = 1) AS rating_count
     FROM wishlists w
     JOIN products p ON p.id = w.product_id
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id
     WHERE w.user_id = ? AND p.active = 1 AND p.deleted_at IS NULL
     ORDER BY w.created_at DESC`,
    [userId]
  );

  const productIds = rows.map((r) => r.product_id);
  const mediaMap = {};
  if (productIds.length > 0) {
    const [mediaRows] = await pool.query(
      'SELECT id, product_id, type, url, sort_order FROM product_media WHERE product_id IN (?) ORDER BY sort_order ASC, id ASC',
      [productIds]
    );
    for (const m of mediaRows) {
      if (!mediaMap[m.product_id]) mediaMap[m.product_id] = [];
      mediaMap[m.product_id].push({ id: m.id, type: m.type, url: m.url });
    }
  }

  return rows.map((r) => ({ ...r, media: mediaMap[r.product_id] || [] }));
}

export async function getWishlist(req, res, next) {
  try {
    res.json({ items: await getWishlistItems(req.user.id) });
  } catch (err) {
    next(err);
  }
}

export async function addToWishlist(req, res, next) {
  try {
    const productId = parseInt(req.params.product_id, 10);

    const [product] = await pool.query(
      'SELECT id FROM products WHERE id = ? AND active = 1 AND deleted_at IS NULL',
      [productId]
    );
    if (product.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await pool.query(
      'INSERT INTO wishlists (user_id, product_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE product_id = VALUES(product_id)',
      [req.user.id, productId]
    );

    res.status(201).json({ items: await getWishlistItems(req.user.id) });
  } catch (err) {
    next(err);
  }
}

export async function removeFromWishlist(req, res, next) {
  try {
    const productId = parseInt(req.params.product_id, 10);
    await pool.query('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [
      req.user.id,
      productId,
    ]);
    res.json({ items: await getWishlistItems(req.user.id) });
  } catch (err) {
    next(err);
  }
}
