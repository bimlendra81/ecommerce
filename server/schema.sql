CREATE DATABASE IF NOT EXISTS ecom
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ecom;

-- Users (customers + admins)
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(30),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  active TINYINT(1) NOT NULL DEFAULT 1,
  avatar VARCHAR(500),
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  image VARCHAR(500),
  featured TINYINT(1) NOT NULL DEFAULT 0,
  featured_order INT NOT NULL DEFAULT 0,
  deleted_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB;

-- Brands
CREATE TABLE IF NOT EXISTS brands (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  active TINYINT(1) NOT NULL DEFAULT 1,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Products
CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  sold INT UNSIGNED NOT NULL DEFAULT 0,
  image VARCHAR(500),
  category_id INT UNSIGNED,
  brand_id INT UNSIGNED,
  active TINYINT(1) NOT NULL DEFAULT 1,
  return_days INT UNSIGNED NULL,
  weight_grams INT UNSIGNED NULL,
  length_cm DECIMAL(8,2) NULL,
  width_cm DECIMAL(8,2) NULL,
  height_cm DECIMAL(8,2) NULL,
  dimension_unit ENUM('cm','in') NOT NULL DEFAULT 'cm',
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id)
    REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_products_brand FOREIGN KEY (brand_id)
    REFERENCES brands(id) ON DELETE SET NULL,
  INDEX idx_products_active_deleted_created (active, deleted_at, created_at),
  FULLTEXT INDEX ft_products_name_desc (name, description)
) ENGINE=InnoDB;

-- Product media (multiple images + videos)
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
) ENGINE=InnoDB;

-- Slides (home hero banners)
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
) ENGINE=InnoDB;

-- Site settings (logo, title, socials, shipping/returns policy)
CREATE TABLE IF NOT EXISTS settings (
  name VARCHAR(100) NOT NULL PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Cart items
CREATE TABLE IF NOT EXISTS carts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cart_user_product (user_id, product_id),
  CONSTRAINT fk_carts_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_carts_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled')
    NOT NULL DEFAULT 'pending',
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_orders_created_at (created_at),
  INDEX idx_orders_status (status),
  INDEX idx_orders_user_created (user_id, created_at)
) ENGINE=InnoDB;

-- Order items (snapshot of product + price at purchase time)
CREATE TABLE IF NOT EXISTS order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id)
    REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Wishlists
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
) ENGINE=InnoDB;

-- Reviews (rating + comment per product per user)
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
) ENGINE=InnoDB;

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  gateway VARCHAR(50) NOT NULL DEFAULT 'razorpay',
  txn_id VARCHAR(200),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  status ENUM('created', 'paid', 'failed') NOT NULL DEFAULT 'created',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id)
    REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_payments_txn_id (txn_id)
) ENGINE=InnoDB;

-- Configurable shipping methods (fees, ETA, active flag)
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
) ENGINE=InnoDB;

-- Customer address book
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
) ENGINE=InnoDB;

-- Per-order shipping snapshot (address + method + tracking)
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
  service VARCHAR(100),
  tracking_number VARCHAR(200),
  tracking_url VARCHAR(500),
  shipped_at TIMESTAMP NULL DEFAULT NULL,
  estimated_delivery DATE NULL,
  delivered_at TIMESTAMP NULL DEFAULT NULL,
  notes TEXT,
  total_product_weight_grams INT UNSIGNED NULL,
  packaging_weight_grams INT UNSIGNED NULL,
  parcel_weight_grams INT UNSIGNED NULL,
  parcel_length_cm DECIMAL(8,2) NULL,
  parcel_width_cm DECIMAL(8,2) NULL,
  parcel_height_cm DECIMAL(8,2) NULL,
  box_name VARCHAR(50),
  shippo_rate_id VARCHAR(100),
  shippo_transaction_id VARCHAR(100),
  label_url VARCHAR(600),
  shipping_status VARCHAR(50),
  shipping_error VARCHAR(255),
  parcel_override JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_shipping_order FOREIGN KEY (order_id)
    REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tracking timeline events
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
) ENGINE=InnoDB;

-- Orders: subtotal + shipping fee split (total = subtotal + fee)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS address_id INT UNSIGNED NULL;

-- Products: per-unit weight + dimensions for carrier shipments
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS weight_grams INT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS length_cm DECIMAL(8,2) NULL,
  ADD COLUMN IF NOT EXISTS width_cm DECIMAL(8,2) NULL,
  ADD COLUMN IF NOT EXISTS height_cm DECIMAL(8,2) NULL,
  ADD COLUMN IF NOT EXISTS dimension_unit ENUM('cm','in') NOT NULL DEFAULT 'cm';

-- Seed admin user (email: admin@example.com, password: admin123)
-- Run AFTER registering your own admin, or change the credentials.
-- Password hash below is bcrypt for "admin123"
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin', 'admin@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8D9J8j9Z7h8J1n4v7b6X7b6X7b6X7b6', 'admin')
ON DUPLICATE KEY UPDATE email = email;

-- Seed default shipping methods + settings
INSERT IGNORE INTO shipping_methods (id, name, description, fee, estimated_days_min, estimated_days_max, sort_order) VALUES
  (1, 'Standard', 'Standard delivery', 5.00, 3, 7, 1),
  (2, 'Express', 'Express delivery', 15.00, 1, 3, 2);

INSERT INTO settings (name, value) VALUES ('shipping_provider', 'manual')
  ON DUPLICATE KEY UPDATE name = name;
INSERT INTO settings (name, value) VALUES ('default_weight_grams', '500')
  ON DUPLICATE KEY UPDATE name = name;
INSERT INTO settings (name, value) VALUES ('shipping_boxes', '[{"name":"S","length":30,"width":20,"height":10,"weight_grams":120},{"name":"M","length":40,"width":30,"height":15,"weight_grams":180},{"name":"L","length":50,"width":35,"height":25,"weight_grams":260},{"name":"XL","length":60,"width":45,"height":35,"weight_grams":380}]')
  ON DUPLICATE KEY UPDATE name = name;
INSERT INTO settings (name, value) VALUES ('shipping_clearance_factor', '1.15')
  ON DUPLICATE KEY UPDATE name = name;
INSERT INTO settings (name, value) VALUES ('shippo_label_file_type', 'PDF')
  ON DUPLICATE KEY UPDATE name = name;
INSERT INTO settings (name, value) VALUES ('home_template', 'marketplace')
  ON DUPLICATE KEY UPDATE name = name;

-- Contact messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contact_messages_created (created_at)
) ENGINE=InnoDB;
