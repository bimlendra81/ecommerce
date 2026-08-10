-- Shipping module migration (apply once to an existing ecom database)
-- Tables are CREATE IF NOT EXISTS so they can be re-run safely.
-- Alters below use ADD COLUMN IF NOT EXISTS (MySQL/MariaDB 10.2+).

USE ecom;

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
  tracking_number VARCHAR(200),
  tracking_url VARCHAR(500),
  shipped_at TIMESTAMP NULL DEFAULT NULL,
  estimated_delivery DATE NULL,
  delivered_at TIMESTAMP NULL DEFAULT NULL,
  notes TEXT,
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

-- Products: per-unit weight for carrier shipments
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS weight_grams INT UNSIGNED NULL;

-- Seed default shipping methods (skip if already present)
INSERT IGNORE INTO shipping_methods (id, name, description, fee, estimated_days_min, estimated_days_max, sort_order)
VALUES
  (1, 'Standard', 'Standard delivery', 5.00, 3, 7, 1),
  (2, 'Express', 'Express delivery', 15.00, 1, 3, 2);

-- Seed shipping settings
INSERT INTO settings (name, value) VALUES
  ('shipping_provider', 'manual')
ON DUPLICATE KEY UPDATE name = name;
INSERT INTO settings (name, value) VALUES
  ('default_weight_grams', '500')
ON DUPLICATE KEY UPDATE name = name;
