import bcrypt from 'bcryptjs';
import { pool } from './config/db.js';

const users = [
  { name: 'Admin', email: 'admin@example.com', password: 'admin123', role: 'admin', phone: null },
  { name: 'Demo User', email: 'demo@example.com', password: 'demo123', role: 'user', phone: '+1 555 0100' },
];

const categories = [
  { name: 'Electronics', slug: 'electronics', featured: 1, featured_order: 1 },
  { name: 'Clothing', slug: 'clothing', featured: 1, featured_order: 2 },
  { name: 'Books', slug: 'books', featured: 0, featured_order: 0 },
  { name: 'Home & Kitchen', slug: 'home-kitchen', featured: 1, featured_order: 3 },
];
const brands = [
  { name: 'Sony', slug: 'sony' },
  { name: 'Nike', slug: 'nike' },
  { name: 'Adidas', slug: 'adidas' },
  { name: 'Bose', slug: 'bose' },
  { name: 'Samsung', slug: 'samsung' },
  { name: 'Generic', slug: 'generic' },
];

const products = [
  { name: 'Wireless Headphones', slug: 'wireless-headphones', description: 'Noise-cancelling over-ear wireless headphones with 30h battery life.', price: 89.99, stock: 25, category: 'electronics', brand: 'sony', return_days: 14 },
  { name: 'Smart Watch', slug: 'smart-watch', description: 'Fitness smartwatch with heart-rate monitor, GPS and 7-day battery.', price: 149.5, stock: 15, category: 'electronics', brand: 'samsung', return_days: 14 },
  { name: 'Bluetooth Speaker', slug: 'bluetooth-speaker', description: 'Portable waterproof Bluetooth speaker with deep bass.', price: 39.99, stock: 40, category: 'electronics', brand: 'bose', return_days: 30 },
  { name: 'Cotton T-Shirt', slug: 'cotton-tshirt', description: 'Premium 100% combed cotton t-shirt, pre-shrunk.', price: 19.99, stock: 60, category: 'clothing', brand: 'nike', return_days: 30 },
  { name: 'Denim Jacket', slug: 'denim-jacket', description: 'Classic blue denim jacket with brass buttons.', price: 59.99, stock: 20, category: 'clothing', brand: 'nike', return_days: 30 },
  { name: 'Running Sneakers', slug: 'running-sneakers', description: 'Lightweight running shoes with cushioned sole.', price: 74.99, stock: 30, category: 'clothing', brand: 'adidas', return_days: 30 },
  { name: 'The Pragmatic Programmer', slug: 'pragmatic-programmer', description: 'Your journey to mastery. Classic software engineering book.', price: 45.0, stock: 12, category: 'books', brand: 'generic', return_days: 7 },
  { name: 'Atomic Habits', slug: 'atomic-habits', description: 'An easy and proven way to build good habits and break bad ones.', price: 21.99, stock: 18, category: 'books', brand: 'generic', return_days: 7 },
  { name: 'Non-stick Cookware Set', slug: 'cookware-set', description: '10-piece non-stick cookware set, dishwasher safe.', price: 129.99, stock: 8, category: 'home-kitchen', brand: 'generic', return_days: 45 },
  { name: 'Coffee Maker', slug: 'coffee-maker', description: '12-cup programmable drip coffee maker with timer.', price: 49.99, stock: 22, category: 'home-kitchen', brand: 'generic', return_days: 45 },
];

const settings = {
  site_title: 'Shop',
  site_logo: '',
  site_favicon: '',
  site_tagline: 'Quality products at great prices. Shop our curated catalog with fast delivery and easy returns.',
  footer_logo: '',
  home_features: JSON.stringify([
    { icon: '🚚', title: 'Free Shipping', text: 'On orders over {threshold}' },
    { icon: '🔒', title: 'Secure Payment', text: '100% protected checkout' },
    { icon: '🎧', title: '24/7 Support', text: 'We are here to help' },
  ]),
  theme: JSON.stringify({ selected: 'premium', primary: '', accent: '' }),
  home_template: 'marketplace',
  facebook_url: '',
  instagram_url: '',
  free_shipping_threshold: '50',
  return_days: '30',
  contact_email: 'support@example.com',
  contact_phone: '+1 800 000 0000',
  shipping_provider: 'manual',
  default_weight_grams: '500',
  shipping_origin_postcode: '',
  shipping_origin_country: 'IN',
  shiprocket_email: '',
  shiprocket_password: '',
  shiprocket_token: '',
  delhivery_api_token: '',
  delhivery_client_name: '',
  shippo_token: '',
};

async function seed() {
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role), phone = VALUES(phone)`,
      [u.name, u.email, u.phone, hash, u.role]
    );
    console.log(`[seed] user: ${u.email} (${u.role})`);
  }

  const categoryIds = {};
  for (const c of categories) {
    await pool.query(
      `INSERT INTO categories (name, slug, image, featured, featured_order) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), image = COALESCE(VALUES(image), image),
         featured = VALUES(featured), featured_order = VALUES(featured_order)`,
      [c.name, c.slug, `/uploads/cat-${c.slug}.jpg`, c.featured || 0, c.featured_order || 0]
    );
    console.log(`[seed] category: ${c.name}`);
  }
  const categoryRows = await pool.query('SELECT id, slug FROM categories');
  for (const row of categoryRows[0]) {
    categoryIds[row.slug] = row.id;
  }

  const brandIds = {};
  for (const b of brands) {
    await pool.query(
      `INSERT INTO brands (name, slug) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [b.name, b.slug]
    );
    console.log(`[seed] brand: ${b.name}`);
  }
  const brandRows = await pool.query('SELECT id, slug FROM brands');
  for (const row of brandRows[0]) {
    brandIds[row.slug] = row.id;
  }

  for (const p of products) {
    await pool.query(
      `INSERT INTO products (name, slug, description, price, stock, image, category_id, brand_id, active, return_days)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
       ON DUPLICATE KEY UPDATE
         description = VALUES(description), price = VALUES(price), stock = VALUES(stock),
         image = VALUES(image), category_id = VALUES(category_id), brand_id = VALUES(brand_id),
         return_days = VALUES(return_days)`,
      [
        p.name,
        p.slug,
        p.description,
        p.price,
        p.stock,
        `/uploads/product-${p.slug}-1.jpg`,
        categoryIds[p.category],
        brandIds[p.brand] || null,
        p.return_days || null,
      ]
    );
  }
  console.log(`[seed] products: ${products.length}`);

  for (const p of products) {
    const url = `/uploads/product-${p.slug}-1.jpg`;
    const [[row]] = await pool.query('SELECT id FROM products WHERE slug = ?', [p.slug]);
    if (!row) continue;
    await pool.query('DELETE FROM product_media WHERE product_id = ?', [row.id]);
    for (let i = 0; i < 3; i++) {
      await pool.query(
        'INSERT INTO product_media (product_id, type, url, sort_order) VALUES (?, ?, ?, ?)',
        [row.id, 'image', `/uploads/product-${p.slug}-${i + 1}.jpg`, i]
      );
    }
    await pool.query('UPDATE products SET image = ? WHERE id = ?', [url, row.id]);
  }
  console.log('[seed] product media gallery ready');

  for (const [name, value] of Object.entries(settings)) {
    await pool.query(
      'INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
      [name, value]
    );
  }
  console.log('[seed] settings ready');

  await pool.end();
}

seed()
  .then(() => console.log('[seed] done'))
  .catch((err) => {
    console.error('[seed] failed:', err.message);
    process.exit(1);
  });
