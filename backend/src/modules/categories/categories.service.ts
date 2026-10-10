import { findAllCategories } from "./categories.repository.js";

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface CategoryNode extends CategoryRef {
  children: CategoryRef[];
}

/** İki seviyeli kategori ağacı: üst kategoriler ve altlarındaki kategoriler. */
export async function listCategoryTree(): Promise<CategoryNode[]> {
  const rows = await findAllCategories(); // sort_order, sonra name sırasıyla gelir
  const roots = new Map<string, CategoryNode>();

  for (const row of rows) {
    if (!row.parent_id) roots.set(row.id, { id: row.id, name: row.name, slug: row.slug, children: [] });
  }
  for (const row of rows) {
    if (!row.parent_id) continue;
    roots.get(row.parent_id)?.children.push({ id: row.id, name: row.name, slug: row.slug });
  }
  return [...roots.values()];
}
