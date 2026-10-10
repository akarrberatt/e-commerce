-- Markalar ayrı tabloya taşınır: slug ile filtreleme ve marka listesi için.
CREATE TABLE IF NOT EXISTS brands (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL,
  slug  TEXT NOT NULL UNIQUE
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS products_brand_id_idx ON products(brand_id);

-- Eski serbest metin sütunu kaldırılır; markaları seed yeniden doldurur (npm run db:seed).
ALTER TABLE products DROP COLUMN IF EXISTS brand;
