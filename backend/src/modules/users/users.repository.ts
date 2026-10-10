import { pool, type DbClient } from "../../db/pool.js";
import type { UserRole } from "../../lib/tokens.js";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string | null; // Google ile açılan hesaplarda null olabilir
  name: string;
  role: UserRole;
  email_verified: boolean;
  google_id: string | null;
  created_at: Date;
}

/** API yanıtlarında dönen kullanıcı (şifre hash'i asla dışarı çıkmaz). */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: Date;
}

export function toPublicUser(u: UserRow): PublicUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    emailVerified: u.email_verified,
    createdAt: u.created_at,
  };
}

export async function findUserByEmail(email: string, db: DbClient = pool) {
  const { rows } = await db.query<UserRow>("SELECT * FROM users WHERE email = $1", [email]);
  return rows[0] ?? null;
}

export async function findUserById(id: string, db: DbClient = pool) {
  const { rows } = await db.query<UserRow>("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0] ?? null;
}

export async function updateUserName(id: string, name: string, db: DbClient = pool) {
  const { rows } = await db.query<UserRow>(
    "UPDATE users SET name = $2, updated_at = now() WHERE id = $1 RETURNING *",
    [id, name],
  );
  return rows[0] ?? null;
}
