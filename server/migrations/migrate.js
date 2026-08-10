import { pool } from '../src/config/db.js';

async function columnExists(table, column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].n > 0;
}

async function addColumn(table, column, definition) {
  if (await columnExists(table, column)) {
    console.log(`[migrate] ${table}.${column} already exists, skip`);
    return;
  }
  await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  console.log(`[migrate] added ${table}.${column}`);
}

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS slides (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200),
      subtitle VARCHAR(500),
      image VARCHAR(500) NOT NULL,
      link VARCHAR(500),
      sort_order INT NOT NULL DEFAULT 0,
      active TINYINT(1) NOT NULL DEFAULT 1,
      deleted_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  console.log('[migrate] table slides ready');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS brands (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(120) NOT NULL UNIQUE,
      active TINYINT(1) NOT NULL DEFAULT 1,
      deleted_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  console.log('[migrate] table brands ready');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_media (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      product_id INT UNSIGNED NOT NULL,
      type ENUM('image', 'video') NOT NULL DEFAULT 'image',
      url VARCHAR(500) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_product_media_product FOREIGN KEY (product_id)
        REFERENCES products(id) ON DELETE CASCADE,
      INDEX idx_product_media_product (product_id)
    ) ENGINE=InnoDB
  `);
  console.log('[migrate] table product_media ready');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      name VARCHAR(100) NOT NULL PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  console.log('[migrate] table settings ready');

  await addColumn('products', 'deleted_at', 'TIMESTAMP NULL DEFAULT NULL');
  await addColumn('products', 'brand_id', 'INT UNSIGNED NULL');
  await addColumn('products', 'return_days', 'INT UNSIGNED NULL');
  const [fkRows] = await pool.query(
    `SELECT COUNT(*) AS n FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND CONSTRAINT_NAME = 'fk_products_brand'`
  );
  if (fkRows[0].n > 0) {
    console.log('[migrate] fk_products_brand already exists, skip');
  } else {
    await pool.query(
      `ALTER TABLE products ADD CONSTRAINT fk_products_brand FOREIGN KEY (brand_id)
       REFERENCES brands(id) ON DELETE SET NULL`
    );
    console.log('[migrate] added fk_products_brand');
  }

  await addColumn('categories', 'deleted_at', 'TIMESTAMP NULL DEFAULT NULL');
  await addColumn('categories', 'image', 'VARCHAR(500) NULL');
  await addColumn('categories', 'featured', 'TINYINT(1) NOT NULL DEFAULT 0');
  await addColumn('categories', 'featured_order', 'INT NOT NULL DEFAULT 0');
  await addColumn('orders', 'deleted_at', 'TIMESTAMP NULL DEFAULT NULL');
  await addColumn('users', 'deleted_at', 'TIMESTAMP NULL DEFAULT NULL');
  await addColumn('users', 'phone', 'VARCHAR(30) NULL');
  await addColumn('users', 'avatar', 'VARCHAR(500) NULL');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wishlists (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      product_id INT UNSIGNED NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_wishlist_user_product (user_id, product_id),
      CONSTRAINT fk_wishlists_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_wishlists_product FOREIGN KEY (product_id)
        REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
  console.log('[migrate] table wishlists ready');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      product_id INT UNSIGNED NOT NULL,
      user_id INT UNSIGNED NOT NULL,
      rating TINYINT UNSIGNED NOT NULL,
      title VARCHAR(200),
      comment TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_review_product_user (product_id, user_id),
      CONSTRAINT fk_reviews_product FOREIGN KEY (product_id)
        REFERENCES products(id) ON DELETE CASCADE,
      CONSTRAINT fk_reviews_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_reviews_product (product_id)
    ) ENGINE=InnoDB
  `);
  console.log('[migrate] table reviews ready');

  // ---- Shipping module ----

  await pool.query(`
    CREATE TABLE IF NOT EXISTS shipping_methods (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description VARCHAR(255),
      fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
      estimated_days_min INT UNSIGNED DEFAULT 3,
      estimated_days_max INT UNSIGNED DEFAULT 7,
      active TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  console.log('[migrate] table shipping_methods ready');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS addresses (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      address_line1 VARCHAR(255) NOT NULL,
      address_line2 VARCHAR(255),
      city VARCHAR(100) NOT NULL,
      state VARCHAR(100) NOT NULL,
      postal_code VARCHAR(20) NOT NULL,
      country VARCHAR(100) NOT NULL DEFAULT 'IN',
      is_default TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_addresses_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_addresses_user (user_id)
    ) ENGINE=InnoDB
  `);
  console.log('[migrate] table addresses ready');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS shipping_info (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      order_id INT UNSIGNED NOT NULL UNIQUE,
      method_id INT UNSIGNED,
      method_name VARCHAR(100),
      fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
      full_name VARCHAR(100) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      address_line1 VARCHAR(255) NOT NULL,
      address_line2 VARCHAR(255),
      city VARCHAR(100) NOT NULL,
      state VARCHAR(100) NOT NULL,
      postal_code VARCHAR(20) NOT NULL,
      country VARCHAR(100) NOT NULL DEFAULT 'IN',
      carrier VARCHAR(100),
      tracking_number VARCHAR(200),
      tracking_url VARCHAR(500),
      shipped_at TIMESTAMP NULL DEFAULT NULL,
      estimated_delivery DATE NULL,
      delivered_at TIMESTAMP NULL DEFAULT NULL,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_shipping_order FOREIGN KEY (order_id)
        REFERENCES orders(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
  console.log('[migrate] table shipping_info ready');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS shipping_events (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      shipping_info_id INT UNSIGNED NOT NULL,
      event VARCHAR(100) NOT NULL,
      location VARCHAR(200),
      notes VARCHAR(500),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_shipping_events_info FOREIGN KEY (shipping_info_id)
        REFERENCES shipping_info(id) ON DELETE CASCADE,
      INDEX idx_shipping_events_info (shipping_info_id)
    ) ENGINE=InnoDB
  `);
  console.log('[migrate] table shipping_events ready');

  await addColumn('orders', 'subtotal', 'DECIMAL(10, 2) NOT NULL DEFAULT 0');
  await addColumn('orders', 'shipping_fee', 'DECIMAL(10, 2) NOT NULL DEFAULT 0');
  await addColumn('orders', 'address_id', 'INT UNSIGNED NULL');
  await addColumn('products', 'weight_grams', 'INT UNSIGNED NULL');
  await addColumn('payments', 'currency', 'VARCHAR(10) NOT NULL DEFAULT "INR"');

  // ---- Tier 1: sale pricing, coupons, tax, emails, refunds ----

  await addColumn('products', 'sale_price', 'DECIMAL(10, 2) NULL');
  await addColumn('products', 'sale_ends_at', 'DATETIME NULL');

  await addColumn('orders', 'discount', 'DECIMAL(10, 2) NOT NULL DEFAULT 0');
  await addColumn('orders', 'coupon_id', 'INT UNSIGNED NULL');
  await addColumn('orders', 'tax_fee', 'DECIMAL(10, 2) NOT NULL DEFAULT 0');

  await addColumn('users', 'reset_token', 'VARCHAR(255) NULL');
  await addColumn('users', 'reset_token_expires', 'DATETIME NULL');

  await addColumn('reviews', 'approved', 'TINYINT(1) NOT NULL DEFAULT 1');
  await addColumn('reviews', 'reported', 'TINYINT(1) NOT NULL DEFAULT 0');
  await addColumn('reviews', 'reported_at', 'DATETIME NULL');

  await addColumn('payments', 'refund_status', "ENUM('none', 'requested', 'refunded') NOT NULL DEFAULT 'none'");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      type ENUM('percent', 'fixed') NOT NULL DEFAULT 'percent',
      value DECIMAL(10, 2) NOT NULL DEFAULT 0,
      min_order_amount DECIMAL(10, 2) NULL,
      max_discount DECIMAL(10, 2) NULL,
      per_user_limit INT UNSIGNED NOT NULL DEFAULT 1,
      starts_at DATETIME NULL,
      expires_at DATETIME NULL,
      active TINYINT(1) NOT NULL DEFAULT 1,
      deleted_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  console.log('[migrate] table coupons ready');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  console.log('[migrate] table subscribers ready');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_contact_messages_created (created_at)
    ) ENGINE=InnoDB
  `);
  console.log('[migrate] table contact_messages ready');

  await pool.query(
    'INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = name',
    ['tax_enabled', '0']
  );
  await pool.query(
    'INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = name',
    ['tax_rate', '0']
  );
  await pool.query(
    'INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = name',
    ['tax_inclusive', '0']
  );
  await pool.query(
    'INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = name',
    ['reviews_auto_approve', '1']
  );
  await pool.query(
    'INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = name',
    ['smtp_host', '']
  );
  await pool.query(
    'INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = name',
    ['smtp_port', '587']
  );
  await pool.query(
    'INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = name',
    ['smtp_secure', '0']
  );
  await pool.query(
    'INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = name',
    ['smtp_user', '']
  );
  await pool.query(
    'INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = name',
    ['smtp_password', '']
  );
  await pool.query(
    'INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = name',
    ['smtp_from', '']
  );

  // ---- Performance indexes ----

  const indexExists = async (table, index) => {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS n FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
      [table, index]
    );
    return rows[0].n > 0;
  };

  const addIndex = async (table, index, columns) => {
    if (await indexExists(table, index)) {
      console.log(`[migrate] index ${table}.${index} already exists, skip`);
      return;
    }
    await pool.query(`ALTER TABLE ${table} ADD INDEX ${index} (${columns})`);
    console.log(`[migrate] added index ${table}.${index} (${columns})`);
  };

  const addFulltext = async (table, index, columns) => {
    if (await indexExists(table, index)) {
      console.log(`[migrate] fulltext ${table}.${index} already exists, skip`);
      return;
    }
    await pool.query(`ALTER TABLE ${table} ADD FULLTEXT INDEX ${index} (${columns})`);
    console.log(`[migrate] added fulltext ${table}.${index} (${columns})`);
  };

  // Denormalized units-sold counter (replaces correlated SUM over order_items).
  await addColumn('products', 'sold', 'INT UNSIGNED NOT NULL DEFAULT 0');

  // Every public product/home query filters (active, deleted_at) and sorts by created_at.
  await addIndex('products', 'idx_products_active_deleted_created', 'active, deleted_at, created_at');
  // Order listings are sorted by created_at in user + admin views.
  await addIndex('orders', 'idx_orders_created_at', 'created_at');
  // User order lists filter by user_id then sort by created_at.
  await addIndex('orders', 'idx_orders_user_created', 'user_id, created_at');
  // Admin dashboard revenue + status filters.
  await addIndex('orders', 'idx_orders_status', 'status');
  // Stripe/Razorpay webhook resolves payments by txn_id.
  await addIndex('payments', 'idx_payments_txn_id', 'txn_id');
  // Product search: replace LIKE %term% full scans.
  await addFulltext('products', 'ft_products_name_desc', 'name, description');

  // Backfill sold from existing order_items.
  await pool.query(`
    UPDATE products p
    LEFT JOIN (
      SELECT product_id, SUM(quantity) AS total FROM order_items GROUP BY product_id
    ) oi ON oi.product_id = p.id
    SET p.sold = COALESCE(oi.total, 0)
  `);
  console.log('[migrate] backfilled products.sold from order_items');

  // Seed default shipping methods (skip if already present)
  await pool.query(
    'INSERT IGNORE INTO shipping_methods (id, name, description, fee, estimated_days_min, estimated_days_max, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [1, 'Standard', 'Standard delivery', 5.0, 3, 7, 1]
  );
  await pool.query(
    'INSERT IGNORE INTO shipping_methods (id, name, description, fee, estimated_days_min, estimated_days_max, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [2, 'Express', 'Express delivery', 15.0, 1, 3, 2]
  );

  // Seed shipping settings
  await pool.query(
    'INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = name',
    ['shipping_provider', 'manual']
  );
  await pool.query(
    'INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = name',
    ['default_weight_grams', '500']
  );

  // ---- Shippo live rates + auto label ----

  await addColumn('products', 'length_cm', 'DECIMAL(8,2) NULL');
  await addColumn('products', 'width_cm', 'DECIMAL(8,2) NULL');
  await addColumn('products', 'height_cm', 'DECIMAL(8,2) NULL');
  await addColumn('products', 'dimension_unit', "ENUM('cm','in') NOT NULL DEFAULT 'cm'");

  await addColumn('shipping_info', 'service', 'VARCHAR(100) NULL');
  await addColumn('shipping_info', 'shipping_error', 'VARCHAR(255) NULL');
  await addColumn('shipping_info', 'total_product_weight_grams', 'INT UNSIGNED NULL');
  await addColumn('shipping_info', 'packaging_weight_grams', 'INT UNSIGNED NULL');
  await addColumn('shipping_info', 'parcel_weight_grams', 'INT UNSIGNED NULL');
  await addColumn('shipping_info', 'parcel_length_cm', 'DECIMAL(8,2) NULL');
  await addColumn('shipping_info', 'parcel_width_cm', 'DECIMAL(8,2) NULL');
  await addColumn('shipping_info', 'parcel_height_cm', 'DECIMAL(8,2) NULL');
  await addColumn('shipping_info', 'box_name', 'VARCHAR(50) NULL');
  await addColumn('shipping_info', 'shippo_rate_id', 'VARCHAR(100) NULL');
  await addColumn('shipping_info', 'shippo_transaction_id', 'VARCHAR(100) NULL');
  await addColumn('shipping_info', 'label_url', 'VARCHAR(600) NULL');
  await addColumn('shipping_info', 'shipping_status', 'VARCHAR(50) NULL');
  await addColumn('shipping_info', 'parcel_override', 'JSON NULL');
  await addColumn('shipping_info', 'last_polled_at', 'DATETIME NULL');

  await pool.query(
    'INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = name',
    [
      'shipping_boxes',
      JSON.stringify([
        { name: 'S', length: 30, width: 20, height: 10, weight_grams: 120 },
        { name: 'M', length: 40, width: 30, height: 15, weight_grams: 180 },
        { name: 'L', length: 50, width: 35, height: 25, weight_grams: 260 },
        { name: 'XL', length: 60, width: 45, height: 35, weight_grams: 380 },
      ]),
    ]
  );
  await pool.query(
    'INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = name',
    ['shipping_clearance_factor', '1.15']
  );
  await pool.query(
    'INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = name',
    ['shippo_label_file_type', 'PDF']
  );
  console.log('[migrate] shippo live-rate columns + settings ready');

  await pool.end();
  console.log('[migrate] done');
}

migrate()
  .then(() => console.log('[migrate] complete'))
  .catch((err) => {
    console.error('[migrate] failed:', err.message);
    process.exit(1);
  });
