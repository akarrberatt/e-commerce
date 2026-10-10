import { kurusToTl } from "../../lib/money.js";
import { toPublicUrl } from "../../lib/publicUrl.js";
import { suggestBrands, suggestCategories, suggestProducts } from "./search.repository.js";

export interface Suggestions {
  products: { id: string; slug: string; name: string; image: string | null; price: number }[];
  categories: { name: string; slug: string }[];
  brands: { name: string; slug: string }[];
}

const MIN_QUERY_LENGTH = 2;
const MAX_PRODUCTS = 6;
const MAX_CATEGORIES = 4;
const MAX_BRANDS = 4;

export async function suggest(query: string): Promise<Suggestions> {
  // Tek harfle öneri üretilmez (çok geniş eşleşir); hata değil, boş yanıt.
  if (query.length < MIN_QUERY_LENGTH) return { products: [], categories: [], brands: [] };

  const [products, categories, brands] = await Promise.all([
    suggestProducts(query, MAX_PRODUCTS),
    suggestCategories(query, MAX_CATEGORIES),
    suggestBrands(query, MAX_BRANDS),
  ]);

  return {
    products: products.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      image: toPublicUrl(row.image),
      price: kurusToTl(row.price_kurus),
    })),
    categories,
    brands,
  };
}
