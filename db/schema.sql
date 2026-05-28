-- Cloudflare D1 schema for the iFixOrlando Glide replacement.
-- Apply with:
--   npx wrangler d1 execute ifixorlando --file=db/schema.sql

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  zip TEXT NOT NULL DEFAULT '',
  unit_floor TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  iphone_model TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  cost REAL NOT NULL DEFAULT 0,
  charge REAL NOT NULL DEFAULT 0,
  coupon REAL NOT NULL DEFAULT 0,
  coupon_code TEXT NOT NULL DEFAULT '',
  scheduled_date TEXT NOT NULL,
  scheduled_end TEXT,
  technician_name TEXT NOT NULL DEFAULT '',
  screen_color TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'admin',
  raw_payload_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON appointments(scheduled_date);

CREATE TABLE IF NOT EXISTS appointment_addons (
  id TEXT PRIMARY KEY,
  appointment_id TEXT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_appointment_addons_appointment_id ON appointment_addons(appointment_id);

CREATE TABLE IF NOT EXISTS appointment_photos (
  id TEXT PRIMARY KEY,
  appointment_id TEXT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_appointment_photos_appointment_id ON appointment_photos(appointment_id);

CREATE TABLE IF NOT EXISTS stock_items (
  id TEXT PRIMARY KEY,
  iphone_model TEXT NOT NULL,
  screen_color TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 0,
  cost_per_unit REAL NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pricing_items (
  id TEXT PRIMARY KEY,
  iphone_model TEXT NOT NULL,
  repair_type TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  parts_cost REAL NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  amount REAL NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  expires_at TEXT
);
