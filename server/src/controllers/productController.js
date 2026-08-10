import { pool } from '../config/db.js';
import { get, set, invalidateStorefront } from '../utils/cache.js';
import { getCachedSettings } from '../utils/settingsCache.js';

const PRODUCTS_TTL_MS = 30_000;

function buildSearchQuery(term) {
  const words = term
    .trim()
    .replace(/[+\-<>()~*"@]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `${w}*`);
  return words.length > 0 ? `+${words.join(' ')}` : '';
}

const PRODUCT_SELECT = `
  SELECT p.id, p.name, p.slug, p.description, p.price, p.sale_price, p.sale_ends_at, p.stock, p.image,
         p.category_id, p.brand_id, p.return_days,
         c.name AS category, c.slug AS category_slug,
         b.name AS brand,
         (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.product_id = p.id AND r.approved = 1) AS rating_avg,
         (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.approved = 1) AS rating_count
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN brands b ON b.id = p.brand_id
`;

async function getMediaForProducts(productIds) {
  if (productIds.length === 0) return {};
  const [rows] = await pool.query(
    'SELECT id, product_id, type, url, sort_order FROM product_media WHERE product_id IN (?) ORDER BY sort_order ASC, id ASC',
    [productIds]
  );
  const byProduct = {};
  for (const row of rows) {
    if (!byProduct[row.product_id]) byProduct[row.product_id] = [];
    byProduct[row.product_id].push({ id: row.id, type: row.type, url: row.url });
  }
  return byProduct;
}

export async function listProducts(req, res, next) {
  try {
    const cacheKey = `products:${req.originalUrl || req.url}`;
    const cached = get(cacheKey);
    if (cached) {
      res.setHeader('Cache-Control', `public, max-age=${PRODUCTS_TTL_MS / 1000}`);
      return res.json(cached);
    }

    const { category, search, brand, minPrice, maxPrice, minRating, sort } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 50);
    const offset = (page - 1) * limit;

    const where = ['p.active = 1', 'p.deleted_at IS NULL'];
    const params = [];

    if (category) {
      where.push('c.slug = ?');
      params.push(category);
    }
    if (brand) {
      const brandSlugs = brand.split(',').map((s) => s.trim()).filter(Boolean);
      if (brandSlugs.length > 0) {
        where.push(`b.slug IN (${brandSlugs.map(() => '?').join(', ')})`);
        params.push(...brandSlugs);
      }
    }
    if (search) {
      const like = `%${search}%`;
      const ft = buildSearchQuery(search);
      if (ft) {
        where.push('MATCH(p.name, p.description) AGAINST (? IN BOOLEAN MODE)');
        params.push(ft);
      } else {
        where.push('(p.name LIKE ? OR p.description LIKE ? OR b.name LIKE ?)');
        params.push(like, like, like);
      }
    }
    if (minPrice !== undefined && minPrice !== '') {
      const min = parseFloat(minPrice);
      if (!Number.isNaN(min)) {
        where.push('p.price >= ?');
        params.push(min);
      }
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      const max = parseFloat(maxPrice);
      if (!Number.isNaN(max)) {
        where.push('p.price <= ?');
        params.push(max);
      }
    }
    if (minRating !== undefined && minRating !== '') {
      const rating = parseFloat(minRating);
      if (!Number.isNaN(rating)) {
        where.push(
          '(SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.product_id = p.id AND r.approved = 1) >= ?'
        );
        params.push(rating);
      }
    }

    let orderBy = 'p.created_at DESC';
    if (sort === 'popular') {
      orderBy = 'p.sold DESC, p.created_at DESC';
    } else if (sort === 'price-asc') {
      orderBy = 'p.price ASC';
    } else if (sort === 'price-desc') {
      orderBy = 'p.price DESC';
    } else if (sort === 'newest') {
      orderBy = 'p.created_at DESC';
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN brands b ON b.id = p.brand_id
       ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `${PRODUCT_SELECT} ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const media = await getMediaForProducts(rows.map((r) => r.id));
    const products = rows.map((r) => ({ ...r, media: media[r.id] || [] }));

    const [brands] = await pool.query(
      `SELECT DISTINCT b.slug, b.name FROM brands b
       JOIN products p ON p.brand_id = b.id
       WHERE p.active = 1 AND p.deleted_at IS NULL AND b.deleted_at IS NULL
       ORDER BY b.name`
    );

    const payload = { products, total, page, pages: Math.ceil(total / limit) || 1, brands };
    set(cacheKey, payload, PRODUCTS_TTL_MS);
    res.setHeader('Cache-Control', `public, max-age=${PRODUCTS_TTL_MS / 1000}`);
    res.json(payload);
  } catch (err) {
    next(err);
  }
}

const PRICERANGE_TTL_MS = 300_000;

export async function getPriceRange(req, res, next) {
  try {
    const cached = get('pricerange');
    if (cached) {
      res.setHeader('Cache-Control', `public, max-age=${PRICERANGE_TTL_MS / 1000}`);
      return res.json(cached);
    }
    const [rows] = await pool.query(
      `SELECT FLOOR(MIN(p.price)) AS minPrice, CEIL(MAX(p.price)) AS maxPrice
       FROM products p
       WHERE p.active = 1 AND p.deleted_at IS NULL`
    );
    const payload = { minPrice: rows[0].minPrice ?? 0, maxPrice: rows[0].maxPrice ?? 0 };
    set('pricerange', payload, PRICERANGE_TTL_MS);
    res.setHeader('Cache-Control', `public, max-age=${PRICERANGE_TTL_MS / 1000}`);
    res.json(payload);
  } catch (err) {
    next(err);
  }
}

const PRODUCT_TTL_MS = 30_000;

export async function getProduct(req, res, next) {
  try {
    const { slug } = req.params;
    if (!req.user) {
      const cached = get(`product:${slug}`);
      if (cached) {
        res.setHeader('Cache-Control', `public, max-age=${PRODUCT_TTL_MS / 1000}`);
        return res.json(cached);
      }
    }
    const [rows] = await pool.query(
      `${PRODUCT_SELECT} WHERE p.slug = ? AND p.active = 1 AND p.deleted_at IS NULL`,
      [slug]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const productId = rows[0].id;
    const media = await getMediaForProducts([productId]);

    const [reviews] = await pool.query(
      `SELECT r.id, r.rating, r.title, r.comment, r.created_at,
              u.id AS user_id, u.name AS user_name, u.avatar AS user_avatar
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ? AND r.approved = 1
       ORDER BY r.created_at DESC`,
      [productId]
    );

    const [frequentlyBoughtTogether] = await pool.query(
      `SELECT oi2.product_id AS id, COUNT(*) AS co_count, p.name, p.slug, p.price, p.stock, p.image,
              c.name AS category, b.name AS brand,
              (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.product_id = p.id AND r.approved = 1) AS rating_avg,
              (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.approved = 1) AS rating_count
       FROM order_items oi1
       JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi1.product_id <> oi2.product_id
       JOIN products p ON p.id = oi2.product_id AND p.active = 1 AND p.deleted_at IS NULL
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN brands b ON b.id = p.brand_id
       WHERE oi1.product_id = ?
       GROUP BY oi2.product_id, p.name, p.slug, p.price, p.stock, p.image, c.name, b.name
       ORDER BY co_count DESC
       LIMIT 4`,
      [productId]
    );

    const fbtIds = frequentlyBoughtTogether.map((f) => f.id);
    const fbtMedia = fbtIds.length > 0 ? await getMediaForProducts(fbtIds) : {};
    const fbt = frequentlyBoughtTogether.map((f) => ({
      ...f,
      media: fbtMedia[f.id] || [],
    }));

    const response = {
      product: {
        ...rows[0],
        media: media[productId] || [],
        reviews,
        rating_avg: rows[0].rating_avg || 0,
        rating_count: rows[0].rating_count || 0,
        frequentlyBoughtTogether: fbt,
      },
    };

    if (req.user) {
      const [purchased] = await pool.query(
        `SELECT 1 FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE oi.product_id = ? AND o.user_id = ? AND o.status <> 'cancelled' AND o.deleted_at IS NULL
         LIMIT 1`,
        [productId, req.user.id]
      );
      response.canReview = purchased.length > 0;
      const [myReview] = await pool.query(
        'SELECT id, rating, title, comment, approved FROM reviews WHERE product_id = ? AND user_id = ?',
        [productId, req.user.id]
      );
      response.myReview = myReview[0] || null;
    }

    if (!req.user) {
      set(`product:${slug}`, response, PRODUCT_TTL_MS);
      res.setHeader('Cache-Control', `public, max-age=${PRODUCT_TTL_MS / 1000}`);
    }
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function listReviews(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.rating, r.title, r.comment, r.created_at,
              u.name AS user_name, u.avatar AS user_avatar
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = (SELECT id FROM products WHERE slug = ? AND deleted_at IS NULL)
         AND r.approved = 1
       ORDER BY r.created_at DESC`,
      [req.params.slug]
    );
    res.json({ reviews: rows });
  } catch (err) {
    next(err);
  }
}

async function findProductIdBySlug(slug) {
  const [rows] = await pool.query(
    'SELECT id FROM products WHERE slug = ? AND active = 1 AND deleted_at IS NULL',
    [slug]
  );
  return rows.length > 0 ? rows[0].id : null;
}

async function autoApproveReviews() {
  const settings = await getCachedSettings();
  return String(settings.reviews_auto_approve) === '1';
}

export async function createReview(req, res, next) {
  try {
    const productId = await findProductIdBySlug(req.params.slug);
    if (!productId) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const rating = parseInt(req.body.rating, 10);
    const title = (req.body.title || '').trim();
    const comment = (req.body.comment || '').trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const [purchased] = await pool.query(
      `SELECT 1 FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.product_id = ? AND o.user_id = ? AND o.status <> 'cancelled' AND o.deleted_at IS NULL
       LIMIT 1`,
      [productId, req.user.id]
    );
    if (purchased.length === 0) {
      return res.status(403).json({ message: 'Only verified buyers can review this product' });
    }

    const approved = (await autoApproveReviews()) ? 1 : 0;

    await pool.query(
      `INSERT INTO reviews (product_id, user_id, rating, title, comment, approved)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), title = VALUES(title), comment = VALUES(comment), approved = VALUES(approved), reported = 0`,
      [productId, req.user.id, rating, title || null, comment || null, approved]
    );

    const [review] = await pool.query(
      `SELECT r.id, r.rating, r.title, r.comment, r.approved, r.created_at, u.name AS user_name, u.avatar AS user_avatar
       FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ? AND r.user_id = ?`,
      [productId, req.user.id]
    );
    invalidateStorefront();
    res.status(201).json({ review: review[0] });
  } catch (err) {
    next(err);
  }
}

export async function updateReview(req, res, next) {
  try {
    const productId = await findProductIdBySlug(req.params.slug);
    if (!productId) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const rating = parseInt(req.body.rating, 10);
    const title = (req.body.title || '').trim();
    const comment = (req.body.comment || '').trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const approved = (await autoApproveReviews()) ? 1 : 0;

    const [result] = await pool.query(
      'UPDATE reviews SET rating = ?, title = ?, comment = ?, approved = ?, reported = 0 WHERE product_id = ? AND user_id = ?',
      [rating, title || null, comment || null, approved, productId, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const [review] = await pool.query(
      `SELECT r.id, r.rating, r.title, r.comment, r.approved, r.created_at, u.name AS user_name, u.avatar AS user_avatar
       FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ? AND r.user_id = ?`,
      [productId, req.user.id]
    );
    invalidateStorefront();
    res.json({ review: review[0] });
  } catch (err) {
    next(err);
  }
}

export async function deleteReview(req, res, next) {
  try {
    const productId = await findProductIdBySlug(req.params.slug);
    if (!productId) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await pool.query('DELETE FROM reviews WHERE product_id = ? AND user_id = ?', [
      productId,
      req.user.id,
    ]);
    invalidateStorefront();
    res.json({ message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
}

export async function reportReview(req, res, next) {
  try {
    const productId = await findProductIdBySlug(req.params.slug);
    if (!productId) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const reviewId = parseInt(req.params.id, 10);
    const [result] = await pool.query(
      'UPDATE reviews SET reported = 1, reported_at = NOW(), approved = 0 WHERE id = ? AND product_id = ?',
      [reviewId, productId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }
    invalidateStorefront();
    res.json({ message: 'Review reported. Thank you for keeping the community safe.' });
  } catch (err) {
    next(err);
  }
}
