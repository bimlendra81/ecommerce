import fs from 'fs';
import path from 'path';
import { pool } from '../config/db.js';
import { UPLOAD_DIR } from '../utils/upload.js';
import { invalidateStorefront } from '../utils/cache.js';
import { syncTrackingIfStale } from '../services/shipping/tracking.js';

const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'failed', 'cancelled'];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function uniqueSlug(base, table) {
  let slug = base;
  let n = 1;
  while (true) {
    const [rows] = await pool.query(`SELECT id FROM ${table} WHERE slug = ?`, [slug]);
    if (rows.length === 0) return slug;
    slug = `${base}-${n++}`;
  }
}

function fileUrl(req, filename) {
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
}

function imageUrlFromRequest(req) {
  if (req.file) {
    return fileUrl(req, req.file.filename);
  }
  if (req.body.image) return req.body.image;
  return null;
}

function mediaFromRequest(req) {
  const media = [];
  if (req.files) {
    for (const f of req.files.images || []) {
      media.push({ type: 'image', url: fileUrl(req, f.filename) });
    }
    for (const f of req.files.videos || []) {
      media.push({ type: 'video', url: fileUrl(req, f.filename) });
    }
  }
  if (req.body.media) {
    try {
      const parsed = JSON.parse(req.body.media);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && item.url) {
            media.push({ type: item.type === 'video' ? 'video' : 'image', url: item.url });
          }
        }
      }
    } catch (err) {
      // ignore malformed media json
    }
  }
  return media;
}

function primaryImage(media, fallback) {
  const first = media.find((m) => m.type === 'image');
  return first ? first.url : fallback;
}

function deleteUploadedFile(url) {
  if (url && url.includes('/uploads/')) {
    const filename = url.split('/uploads/')[1];
    fs.unlink(path.join(UPLOAD_DIR, filename), () => {});
  }
}

async function replaceMedia(productId, media) {
  const [oldRows] = await pool.query('SELECT url FROM product_media WHERE product_id = ?', [productId]);
  await pool.query('DELETE FROM product_media WHERE product_id = ?', [productId]);

  const newUrls = new Set(media.map((m) => m.url));
  for (const row of oldRows) {
    if (!newUrls.has(row.url)) deleteUploadedFile(row.url);
  }

  let sortOrder = 0;
  for (const item of media) {
    await pool.query(
      'INSERT INTO product_media (product_id, type, url, sort_order) VALUES (?, ?, ?, ?)',
      [productId, item.type, item.url, sortOrder++]
    );
  }
}

async function getProductById(id) {
  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.slug, p.description, p.price, p.sale_price, p.sale_ends_at, p.stock, p.image,
            p.category_id, p.brand_id, p.active, p.return_days, p.weight_grams, c.name AS category, b.name AS brand
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id
     WHERE p.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function getMedia(productId) {
  const [rows] = await pool.query(
    'SELECT id, type, url, sort_order FROM product_media WHERE product_id = ? ORDER BY sort_order ASC, id ASC',
    [productId]
  );
  return rows;
}

// ---- Dashboard ----

export async function getStats(req, res, next) {
  try {
    const [[sales]] = await pool.query(
      "SELECT COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS order_count FROM orders WHERE status IN ('paid','shipped','in_transit','out_for_delivery','delivered') AND deleted_at IS NULL"
    );
    const [[products]] = await pool.query('SELECT COUNT(*) AS count FROM products WHERE deleted_at IS NULL');
    const [[users]] = await pool.query("SELECT COUNT(*) AS count FROM users WHERE role = 'user' AND deleted_at IS NULL");
    const [[lowStock]] = await pool.query('SELECT COUNT(*) AS count FROM products WHERE stock <= 5 AND deleted_at IS NULL');
    const [recentOrders] = await pool.query(
      `SELECT o.id, o.total, o.status, o.created_at, u.name AS user_name, u.email AS user_email
       FROM orders o JOIN users u ON u.id = o.user_id
       WHERE o.deleted_at IS NULL
       ORDER BY o.created_at DESC LIMIT 5`
    );
    const [salesByDay] = await pool.query(
      `SELECT DATE(created_at) AS day, COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
       FROM orders
       WHERE status IN ('paid','shipped','in_transit','out_for_delivery','delivered')
         AND deleted_at IS NULL
         AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at) ORDER BY day`
    );

    res.json({
      stats: {
        revenue: sales.revenue,
        orderCount: sales.order_count,
        productCount: products.count,
        userCount: users.count,
        lowStockCount: lowStock.count,
      },
      recentOrders,
      salesByDay,
    });
  } catch (err) {
    next(err);
  }
}

// ---- Products ----

export async function getAdminProduct(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const product = await getProductById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ product: { ...product, media: await getMedia(id) } });
  } catch (err) {
    next(err);
  }
}

export async function listAdminProducts(req, res, next) {
  try {
    const { search, showDeleted } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const offset = (page - 1) * limit;

    const where = [];
    const params = [];
    if (showDeleted === '1') {
      where.push('p.deleted_at IS NOT NULL');
    } else {
      where.push('p.deleted_at IS NULL');
    }
    if (search) {
      where.push('(p.name LIKE ? OR p.slug LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM products p ${whereSql}`, params);
    const total = countRows[0].total;

    const [products] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.description, p.price, p.sale_price, p.sale_ends_at, p.stock, p.image,
              p.category_id, p.brand_id, p.active, p.deleted_at, p.return_days, p.weight_grams, c.name AS category, b.name AS brand
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN brands b ON b.id = p.brand_id
       ${whereSql}
       ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const mediaMap = {};
    if (products.length > 0) {
      const [mediaRows] = await pool.query(
        'SELECT product_id, type, url FROM product_media WHERE product_id IN (?) ORDER BY sort_order ASC, id ASC',
        [products.map((p) => p.id)]
      );
      for (const m of mediaRows) {
        if (!mediaMap[m.product_id]) mediaMap[m.product_id] = [];
        mediaMap[m.product_id].push(m);
      }
    }
    for (const p of products) {
      p.media = mediaMap[p.id] || [];
    }

    res.json({ products, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req, res, next) {
  try {
    const { name, description, price, sale_price, sale_ends_at, stock, category_id, brand_id, active, return_days, weight_grams } = req.body;
    if (!name || price === undefined || price === null || price === '') {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    const slug = await uniqueSlug(slugify(name), 'products');
    const media = mediaFromRequest(req);
    const image = primaryImage(media, imageUrlFromRequest(req));
    const isActive = active === undefined || active === '1' || active === 1 ? 1 : 0;

    const [result] = await pool.query(
      `INSERT INTO products (name, slug, description, price, sale_price, sale_ends_at, stock, image, category_id, brand_id, active, return_days, weight_grams)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        slug,
        description || null,
        Number(price),
        sale_price !== undefined && sale_price !== '' ? Number(sale_price) : null,
        sale_ends_at || null,
        Number(stock) || 0,
        image,
        category_id || null,
        brand_id || null,
        isActive,
        return_days !== undefined && return_days !== '' ? Number(return_days) : null,
        weight_grams !== undefined && weight_grams !== '' ? Number(weight_grams) : null,
      ]
    );

    if (media.length > 0) {
      await replaceMedia(result.insertId, media);
    }

    const product = await getProductById(result.insertId);
    invalidateStorefront();
    res.status(201).json({ product: { ...product, media: await getMedia(result.insertId) } });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await getProductById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { name, description, price, sale_price, sale_ends_at, stock, category_id, brand_id, active, return_days, weight_grams } = req.body;
    const media = mediaFromRequest(req);
    const uploaded = req.files && ((req.files.images || []).length > 0 || (req.files.videos || []).length > 0);
    const hasNewMedia = uploaded || req.body.media !== undefined;

    const image = hasNewMedia ? primaryImage(media, existing.image) : imageUrlFromRequest(req) || existing.image;

    let slug = existing.slug;
    if (name && name !== existing.name) {
      slug = await uniqueSlug(slugify(name), 'products');
    }

    await pool.query(
      `UPDATE products
       SET name = ?, slug = ?, description = ?, price = ?, sale_price = ?, sale_ends_at = ?, stock = ?, image = ?, category_id = ?, brand_id = ?, active = ?, return_days = ?, weight_grams = ?
       WHERE id = ?`,
      [
        name !== undefined ? name : existing.name,
        slug,
        description !== undefined ? description : existing.description,
        price !== undefined ? Number(price) : existing.price,
        sale_price !== undefined && sale_price !== '' ? Number(sale_price) : existing.sale_price ?? null,
        sale_ends_at !== undefined ? sale_ends_at : existing.sale_ends_at,
        stock !== undefined ? Number(stock) : existing.stock,
        image,
        category_id !== undefined && category_id !== '' ? category_id : existing.category_id,
        brand_id !== undefined && brand_id !== '' ? brand_id : existing.brand_id,
        active === undefined || active === '1' || active === 1 ? 1 : 0,
        return_days !== undefined && return_days !== '' ? Number(return_days) : existing.return_days,
        weight_grams !== undefined && weight_grams !== '' ? Number(weight_grams) : existing.weight_grams,
        id,
      ]
    );

    if (hasNewMedia) {
      await replaceMedia(id, media);
    }
    invalidateStorefront();
    res.json({ product: { ...(await getProductById(id)), media: await getMedia(id) } });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await pool.query(
      'UPDATE products SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    invalidateStorefront();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
}

export async function restoreProduct(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await pool.query('UPDATE products SET deleted_at = NULL WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    invalidateStorefront();
    res.json({ message: 'Product restored' });
  } catch (err) {
    next(err);
  }
}

// ---- Categories ----

export async function listAdminCategories(req, res, next) {
  try {
    const showDeleted = req.query.showDeleted === '1';
    const where = showDeleted ? 'c.deleted_at IS NOT NULL' : 'c.deleted_at IS NULL';
    const [categories] = await pool.query(
      `SELECT c.id, c.name, c.slug, c.image, c.featured, c.featured_order, c.deleted_at,
              (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.deleted_at IS NULL) AS product_count
       FROM categories c
       WHERE ${where}
       ORDER BY c.featured DESC, c.featured_order ASC, c.name`
    );
    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req, res, next) {
  try {
    const { name, featured, featured_order } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    const slug = await uniqueSlug(slugify(name), 'categories');
    const image = imageUrlFromRequest(req);
    const featuredVal = featured ? 1 : 0;
    const featuredOrder = parseInt(featured_order, 10) || 0;
    const [result] = await pool.query(
      'INSERT INTO categories (name, slug, image, featured, featured_order) VALUES (?, ?, ?, ?, ?)',
      [name, slug, image, featuredVal, featuredOrder]
    );
    invalidateStorefront();
    res.status(201).json({ category: { id: result.insertId, name, slug, image, featured: featuredVal, featured_order: featuredOrder } });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, featured, featured_order } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    const [rows] = await pool.query('SELECT id FROM categories WHERE id = ? AND deleted_at IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    const slug = await uniqueSlug(slugify(name), 'categories');
    const image = imageUrlFromRequest(req);
    const featuredVal = featured ? 1 : 0;
    const featuredOrder = parseInt(featured_order, 10) || 0;
    await pool.query(
      'UPDATE categories SET name = ?, slug = ?, image = COALESCE(?, image), featured = ?, featured_order = ? WHERE id = ?',
      [name, slug, image, featuredVal, featuredOrder, id]
    );
    invalidateStorefront();
    res.json({ message: 'Category updated' });
  } catch (err) {
    next(err);
  }
}

export async function setCategoryFeatured(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { featured } = req.body;
    const featuredVal = featured ? 1 : 0;
    const [result] = await pool.query(
      'UPDATE categories SET featured = ? WHERE id = ? AND deleted_at IS NULL',
      [featuredVal, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    invalidateStorefront();
    res.json({ message: 'Category featured status updated', featured: featuredVal });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await pool.query(
      'UPDATE categories SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    await pool.query('UPDATE products SET category_id = NULL WHERE category_id = ?', [id]);
    invalidateStorefront();
    res.json({ message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
}

export async function restoreCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await pool.query('UPDATE categories SET deleted_at = NULL WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    invalidateStorefront();
    res.json({ message: 'Category restored' });
  } catch (err) {
    next(err);
  }
}

// ---- Orders ----

export async function adminListOrders(req, res, next) {
  try {
    const { status, search, showDeleted } = req.query;
    const where = [];
    const params = [];
    if (showDeleted === '1') {
      where.push('o.deleted_at IS NOT NULL');
    } else {
      where.push('o.deleted_at IS NULL');
    }
    if (status) {
      where.push('o.status = ?');
      params.push(status);
    }
    if (search) {
      where.push('(o.id = ? OR u.email LIKE ? OR u.name LIKE ?)');
      params.push(parseInt(search, 10) || 0, `%${search}%`, `%${search}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [orders] = await pool.query(
      `SELECT o.id, o.user_id, o.total, o.status, o.created_at, o.deleted_at,
              u.name AS user_name, u.email AS user_email,
              (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count,
              (SELECT p.refund_status FROM payments p WHERE p.order_id = o.id ORDER BY p.id DESC LIMIT 1) AS refund_status
       FROM orders o JOIN users u ON u.id = o.user_id
       ${whereSql}
       ORDER BY o.created_at DESC LIMIT 200`,
      params
    );
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

export async function adminGetOrder(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [rows] = await pool.query(
      `SELECT o.id, o.user_id, o.total, o.subtotal, o.shipping_fee, o.status, o.created_at,
              u.name AS user_name, u.email AS user_email
       FROM orders o JOIN users u ON u.id = o.user_id
       WHERE o.id = ? AND o.deleted_at IS NULL`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const [items] = await pool.query(
      `SELECT oi.id, oi.product_id, oi.name, oi.price, oi.quantity, p.weight_grams
       FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
      [id]
    );
    const [payments] = await pool.query(
      'SELECT id, gateway, txn_id, amount, status, refund_status, created_at FROM payments WHERE order_id = ?',
      [id]
    );
    const [shippingRows] = await pool.query('SELECT * FROM shipping_info WHERE order_id = ?', [id]);
    let shipping = null;
    if (shippingRows.length > 0) {
      const [events] = await pool.query(
        'SELECT id, event, location, notes, created_at FROM shipping_events WHERE shipping_info_id = ? ORDER BY created_at ASC, id ASC',
        [shippingRows[0].id]
      );
      shipping = { ...shippingRows[0], events };
    }
    if (shipping?.tracking_number) {
      try {
        await syncTrackingIfStale({
          infoId: shipping.id,
          carrier: shipping.carrier,
          trackingNumber: shipping.tracking_number,
        });
        const [refreshed] = await pool.query(
          'SELECT id, event, location, notes, created_at FROM shipping_events WHERE shipping_info_id = ? ORDER BY created_at ASC, id ASC',
          [shipping.id]
        );
        shipping = { ...shipping, events: refreshed };
      } catch {
        // sync failed — still serve cached events
      }
    }
    res.json({ order: { ...rows[0], items, payments, shipping } });
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${ORDER_STATUSES.join(', ')}` });
    }
    const [rows] = await pool.query(
      'SELECT id, status FROM orders WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const current = rows[0].status;
    if (current === status) {
      return res.json({ message: 'Order status unchanged' });
    }
    if (current === 'cancelled' || current === 'delivered') {
      return res.status(400).json({ message: `Cannot change a ${current} order` });
    }
    if (status === 'delivered' && current !== 'shipped') {
      return res.status(400).json({ message: 'Order must be shipped before it can be delivered' });
    }

    let stamp = '';
    if (status === 'shipped') {
      stamp = 'shipped_at';
    } else if (status === 'delivered') {
      stamp = 'delivered_at';
    }
    if (stamp) {
      await pool.query(
        `UPDATE shipping_info SET ${stamp} = IFNULL(${stamp}, NOW()) WHERE order_id = ?`,
        [id]
      );
    }

    await pool.query('UPDATE orders SET status = ? WHERE id = ? AND deleted_at IS NULL', [
      status,
      id,
    ]);

    res.json({ message: 'Order status updated' });
  } catch (err) {
    next(err);
  }
}

export async function deleteOrder(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await pool.query(
      'UPDATE orders SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order deleted' });
  } catch (err) {
    next(err);
  }
}

export async function restoreOrder(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await pool.query('UPDATE orders SET deleted_at = NULL WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order restored' });
  } catch (err) {
    next(err);
  }
}

export async function refundOrder(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [orderRows] = await pool.query(
      'SELECT id, status FROM orders WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (orderRows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (orderRows[0].status === 'cancelled') {
      return res.status(400).json({ message: 'Cancelled orders cannot be refunded' });
    }

    const [payments] = await pool.query(
      "SELECT id, amount, refund_status FROM payments WHERE order_id = ? AND status = 'paid' ORDER BY id DESC LIMIT 1",
      [id]
    );
    if (payments.length === 0) {
      return res.status(400).json({ message: 'No paid payment found for this order' });
    }
    const payment = payments[0];
    if (payment.refund_status === 'refunded') {
      return res.status(400).json({ message: 'This order has already been refunded' });
    }

    await pool.query('UPDATE payments SET refund_status = ? WHERE id = ?', ['refunded', payment.id]);
    res.json({ message: `Refunded ${Number(payment.amount).toFixed(2)}` });
  } catch (err) {
    next(err);
  }
}

// ---- Users ----

export async function listUsers(req, res, next) {
  try {
    const [users] = await pool.query(
      "SELECT id, name, email, role, active, created_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC"
    );
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { active, role } = req.body;

    if (id === req.user.id) {
      return res.status(400).json({ message: 'You cannot modify your own account' });
    }
    if (role && !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be user or admin' });
    }

    const [rows] = await pool.query('SELECT id FROM users WHERE id = ? AND deleted_at IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (active !== undefined) {
      await pool.query('UPDATE users SET active = ? WHERE id = ?', [active ? 1 : 0, id]);
    }
    if (role) {
      await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    }

    res.json({ message: 'User updated' });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    const [result] = await pool.query(
      'UPDATE users SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
}

export async function restoreUser(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await pool.query('UPDATE users SET deleted_at = NULL WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User restored' });
  } catch (err) {
    next(err);
  }
}

// ---- Review moderation ----

export async function listAdminReviews(req, res, next) {
  try {
    const { filter, search } = req.query;
    let where = '1 = 1';
    const params = [];
    if (filter === 'pending') {
      where += ' AND r.approved = 0';
    } else if (filter === 'approved') {
      where += ' AND r.approved = 1';
    } else if (filter === 'reported') {
      where += ' AND r.reported = 1';
    }
    if (search) {
      where += ' AND (r.comment LIKE ? OR r.title LIKE ? OR u.email LIKE ? OR u.name LIKE ? OR p.name LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like, like, like);
    }
    const [reviews] = await pool.query(
      `SELECT r.id, r.rating, r.title, r.comment, r.approved, r.reported, r.reported_at, r.created_at,
              u.id AS user_id, u.name AS user_name, u.email AS user_email,
              p.id AS product_id, p.name AS product_name, p.slug AS product_slug
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       JOIN products p ON p.id = r.product_id
       WHERE ${where}
       ORDER BY r.reported DESC, r.created_at DESC
       LIMIT 200`,
      params
    );
    res.json({ reviews });
  } catch (err) {
    next(err);
  }
}

export async function moderateReview(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const approved = req.body.approved ? 1 : 0;
    const [result] = await pool.query(
      `UPDATE reviews SET approved = ?, reported = IF(? = 1, 0, reported), reported_at = NULL
       WHERE id = ?`,
      [approved, approved, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }
    invalidateStorefront();
    res.json({ message: approved ? 'Review approved' : 'Review rejected' });
  } catch (err) {
    next(err);
  }
}
