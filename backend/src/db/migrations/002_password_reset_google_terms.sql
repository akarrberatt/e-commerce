-- Google ile açılan hesapların şifresi olmayabilir.
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Google hesabı bağlantısı (Google'ın kalıcı kullanıcı kimliği, "sub").
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;

-- Kullanım Şartları / Gizlilik Politikası onayının kaydı.
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_version TEXT;

-- Refresh token neden iptal edildi: rotated | logout | reuse | password_reset
-- ("rotated" olanlar kısa bir tolerans süresi boyunca tekrar kullanılabilir).
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS revoke_reason TEXT;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,
  expires_at   TIMESTAMPTZ NOT NULL,
  used_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx ON password_reset_tokens(user_id);
