import { pool, type DbClient } from "../../db/pool.js";

export interface CategoryRow {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
}

export async function findAllCategories(db: DbClient = pool) {
  const { rows } = await db.query<CategoryRow>(
    "SELECT id, parent_id, name, slug FROM categories ORDER BY sort_order, name, id",
  );
  return rows;
}

/** Slug'ı verilen kategorinin ve (üst kategoriyse) alt kategorilerinin id'leri; kategori yoksa null. */
export async function findCategoryIdsBySlug(slug: string, db: DbClient = pool): Promise<string[] | null> {
  const { rows } = await db.query<{ id: string }>(
    `SELECT c.id
       FROM categories root
       JOIN categories c ON c.id = root.id OR c.parent_id = root.id
      WHERE root.slug = $1`,
    [slug],
  );
  return rows.length ? rows.map((r) => r.id) : null;
}
