import { HttpError } from "../../lib/httpError.js";
import { CURRENCY, kurusToTl, tlToKurus } from "../../lib/money.js";
import { findCategoryIdsBySlug } from "../categories/categories.repository.js";
import type { CategoryRef } from "../categories/categories.service.js";
import {
  countProducts,
  findActiveProductBySlug,
  findProductImages,
  findProducts,
  type ProductFilters,
  type ProductRow,
} from "./products.repository.js";
import type { ListProductsQuery } from "./products.schemas.js";

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  price: number;
  oldPrice: number | null;
  /** Tam sayı yüzde; eski fiyat yoksa null. */
  discountRate: number | null;
  currency: typeof CURRENCY;
  image: string | null;
  stock: number;
  inStock: boolean;
  rating: { average: number; count: number };
  favoriteCount: number;
  /** İsteği yapan kullanıcının favorisinde mi; token yoksa false. */
  isFavorite: boolean;
  category: CategoryRef;
}

export interface ProductDetail extends ProductSummary {
  description: string;
  images: { url: string; alt: string }[];
  breadcrumb: { name: string; slug: string }[];
}

export interface ProductList {
  items: ProductSummary[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function toSummary(row: ProductRow): ProductSummary {
  const old = row.compare_at_price_kurus;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    price: kurusToTl(row.price_kurus),
    oldPrice: old === null ? null : kurusToTl(old),
    discountRate: old === null ? null : Math.round(((old - row.price_kurus) / old) * 100),
    currency: CURRENCY,
    image: row.image,
    stock: row.stock,
    inStock: row.stock > 0,
    rating: { average: Number(row.rating_avg), count: row.rating_count },
    favoriteCount: row.favorite_count,
    isFavorite: row.is_favorite,
    category: { id: row.category_id, name: row.category_name, slug: row.category_slug },
  };
}

export async function listProducts(query: ListProductsQuery, viewerId: string | null): Promise<ProductList> {
  const filters: ProductFilters = {
    q: query.q || undefined,
    minPriceKurus: query.minPrice === undefined ? undefined : tlToKurus(query.minPrice),
    maxPriceKurus: query.maxPrice === undefined ? undefined : tlToKurus(query.maxPrice),
    inStock: query.inStock,
  };

  if (query.category) {
    // Üst kategori verildiyse alt kategorilerinin ürünleri de gelir.
    const categoryIds = await findCategoryIdsBySlug(query.category);
    if (!categoryIds) throw new HttpError(404, "Kategori bulunamadı.", "NOT_FOUND");
    filters.categoryIds = categoryIds;
  }

  const { page, limit } = query;
  const [rows, total] = await Promise.all([
    findProducts(filters, query.sort, limit, (page - 1) * limit, viewerId),
    countProducts(filters),
  ]);

  return {
    items: rows.map(toSummary),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getProduct(slug: string, viewerId: string | null): Promise<ProductDetail> {
  const row = await findActiveProductBySlug(slug, viewerId);
  if (!row) throw new HttpError(404, "Ürün bulunamadı.", "NOT_FOUND");

  const images = await findProductImages(row.id);
  const breadcrumb = [{ name: row.category_name, slug: row.category_slug }];
  if (row.parent_category_name && row.parent_category_slug) {
    breadcrumb.unshift({ name: row.parent_category_name, slug: row.parent_category_slug });
  }

  return { ...toSummary(row), description: row.description, images, breadcrumb };
}
