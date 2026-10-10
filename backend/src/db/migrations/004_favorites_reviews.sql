-- Favoriler: kullanıcı başına ürün başına tek satır.
CREATE TABLE IF NOT EXISTS favorites (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);
CREATE INDEX IF NOT EXISTS favorites_user_id_created_at_idx ON favorites(user_id, created_at DESC);

-- Sayaç, favori eklenip silindikçe aynı transaction içinde güncellenir.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS favorite_count INT NOT NULL DEFAULT 0 CHECK (favorite_count >= 0);

-- Değerlendirmeler: kullanıcı bir ürüne tek yorum yazabilir.
CREATE TABLE IF NOT EXISTS reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);
CREATE INDEX IF NOT EXISTS reviews_product_id_created_at_idx ON reviews(product_id, created_at DESC);

-- rating_avg / rating_count artık gerçek yorumlardan hesaplanır; eski sabit değerler sıfırlanır.
UPDATE products SET rating_avg = 0, rating_count = 0;
