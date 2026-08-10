import { pool } from '../config/db.js';
import { effectivePrice } from '../utils/price.js';

async function getCartItems(userId) {
  const [rows] = await pool.query(
    `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.slug, p.price, p.sale_price, p.sale_ends_at, p.image, p.stock
     FROM carts ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = ? AND p.deleted_at IS NULL`,
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

  return rows.map((r) => ({
    ...r,
    price: effectivePrice(r),
    original_price: Number(r.price),
    media: mediaMap[r.product_id] || [],
  }));
}

export async function getCart(req, res, next) {
  try {
    res.json({ items: await getCartItems(req.user.id) });
  } catch (err) {
    next(err);
  }
}

export async function addToCart(req, res, next) {
  try {
    const { product_id } = req.body;
    const qty = Math.max(parseInt(req.body.quantity, 10) || 1, 1);

    const [product] = await pool.query(
      'SELECT id, stock FROM products WHERE id = ? AND active = 1 AND deleted_at IS NULL',
      [product_id]
    );
    if (product.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const [existing] = await pool.query(
      'SELECT id, quantity FROM carts WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );

    if (existing.length > 0) {
      const newQty = existing[0].quantity + qty;
      if (newQty > product[0].stock) {
        return res.status(400).json({ message: 'Not enough stock' });
      }
      await pool.query('UPDATE carts SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
    } else {
      if (qty > product[0].stock) {
        return res.status(400).json({ message: 'Not enough stock' });
      }
      await pool.query(
        'INSERT INTO carts (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.user.id, product_id, qty]
      );
    }

    res.status(201).json({ items: await getCartItems(req.user.id) });
  } catch (err) {
    next(err);
  }
}

export async function updateQuantity(req, res, next) {
  try {
    const productId = parseInt(req.params.product_id, 10);
    const quantity = Math.max(parseInt(req.body.quantity, 10) || 1, 1);

    const [product] = await pool.query(
      'SELECT stock FROM products WHERE id = ? AND active = 1 AND deleted_at IS NULL',
      [productId]
    );
    if (product.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (quantity > product[0].stock) {
      return res.status(400).json({ message: 'Not enough stock' });
    }

    const [result] = await pool.query(
      'UPDATE carts SET quantity = ? WHERE user_id = ? AND product_id = ?',
      [quantity, req.user.id, productId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Item not in cart' });
    }

    res.json({ items: await getCartItems(req.user.id) });
  } catch (err) {
    next(err);
  }
}

export async function removeFromCart(req, res, next) {
  try {
    const productId = parseInt(req.params.product_id, 10);
    await pool.query('DELETE FROM carts WHERE user_id = ? AND product_id = ?', [
      req.user.id,
      productId,
    ]);
    res.json({ items: await getCartItems(req.user.id) });
  } catch (err) {
    next(err);
  }
}

export async function clearCart(req, res, next) {
  try {
    await pool.query('DELETE FROM carts WHERE user_id = ?', [req.user.id]);
    res.json({ items: [] });
  } catch (err) {
    next(err);
  }
}
