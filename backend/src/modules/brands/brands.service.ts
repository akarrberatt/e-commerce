import { HttpError } from "../../lib/httpError.js";
import { findCategoryIdsBySlug } from "../categories/categories.repository.js";
import { findBrandsWithProductCount } from "./brands.repository.js";

export interface BrandWithCount {
  name: string;
  slug: string;
  productCount: number;
}

export async function listBrands(categorySlug?: string): Promise<BrandWithCount[]> {
  let categoryIds: string[] | null = null;
  if (categorySlug) {
    // Üst kategori verildiyse alt kategorilerinin ürünleri de sayılır.
    categoryIds = await findCategoryIdsBySlug(categorySlug);
    if (!categoryIds) throw new HttpError(404, "Kategori bulunamadı.", "NOT_FOUND");
  }

  const rows = await findBrandsWithProductCount(categoryIds);
  return rows.map((row) => ({ name: row.name, slug: row.slug, productCount: row.product_count }));
}
