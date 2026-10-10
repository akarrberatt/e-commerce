-- Kategoriler iki seviyeli (üst > alt). İkiden fazla seviye uygulama tarafında engellenir.
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   UUID REFERENCES categories(id),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON categories(parent_id);

-- Para kuruş cinsinden INTEGER tutulur (float yok). Varyant yok: tek fiyat, tek stok.
CREATE TABLE IF NOT EXISTS products (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id             UUID NOT NULL REFERENCES categories(id),
  slug                    TEXT NOT NULL UNIQUE,
  name                    TEXT NOT NULL,
  description             TEXT NOT NULL DEFAULT '',
  brand                   TEXT,
  price_kurus             INT NOT NULL CHECK (price_kurus >= 0),
  -- İndirim öncesi (eski) fiyat; varsa güncel fiyattan büyük olmalı.
  compare_at_price_kurus  INT CHECK (compare_at_price_kurus IS NULL OR compare_at_price_kurus > price_kurus),
  stock                   INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  rating_avg              NUMERIC(2,1) NOT NULL DEFAULT 0 CHECK (rating_avg BETWEEN 0 AND 5),
  rating_count            INT NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_category_id_idx ON products(category_id);
CREATE INDEX IF NOT EXISTS products_active_created_at_idx ON products(is_active, created_at);
CREATE INDEX IF NOT EXISTS products_price_kurus_idx ON products(price_kurus);

-- Görseller yalnızca URL olarak tutulur (dosya yükleme yok).
CREATE TABLE IF NOT EXISTS product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt         TEXT NOT NULL DEFAULT '',
  sort_order  INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS product_images_product_id_sort_idx ON product_images(product_id, sort_order);
