import { z } from "zod";

// Query değerleri string gelir; boş değer (?minPrice=) "verilmedi" sayılır.
export const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const intParam = (label: string, min: number, max: number, fallback: number) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: `${label} bir sayı olmalı.` })
      .int(`${label} tam sayı olmalı.`)
      .min(min, `${label} en az ${min} olabilir.`)
      .max(max, `${label} en fazla ${max} olabilir.`)
      .default(fallback),
  );

// INTEGER kuruş sütununa sığan üst sınır (10 milyon TL).
const MAX_PRICE_TL = 10_000_000;

const priceParam = (label: string) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: `${label} bir sayı olmalı.` })
      .min(0, `${label} negatif olamaz.`)
      .max(MAX_PRICE_TL, `${label} çok büyük.`)
      .optional(),
  );

const MAX_BRANDS = 10;

/** Kategori slug'ı filtresi (ürün listesi ve marka listesi ortak kullanır). */
export const categoryParam = z
  .string({ error: "Kategori geçersiz." })
  .trim()
  .max(100, "Kategori geçersiz.")
  .optional();

export const PRODUCT_SORTS = ["newest", "price_asc", "price_desc", "rating", "discount", "favorites"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const pageParam = intParam("Sayfa numarası", 1, Number.MAX_SAFE_INTEGER, 1);
const limitParam = intParam("Sayfa boyutu", 1, 50, 20);

/** Ürün listesi döndüren diğer uçlar (ör. favoriler) aynı sayfalama kurallarını kullanır. */
export const productPaginationSchema = z.object({ page: pageParam, limit: limitParam });

export const listProductsQuerySchema = z
  .object({
    page: pageParam,
    limit: limitParam,
    category: categoryParam,
    // Virgülle ayrılmış marka slug'ları: ?brand=novabit,tekvia
    brand: z
      .string({ error: "Marka geçersiz." })
      .max(1000, "Marka geçersiz.")
      .optional()
      .transform((value) => {
        const slugs = [...new Set((value ?? "").split(",").map((slug) => slug.trim()).filter(Boolean))];
        return slugs.length ? slugs : undefined;
      })
      .refine((slugs) => !slugs || slugs.length <= MAX_BRANDS, `En fazla ${MAX_BRANDS} marka seçilebilir.`),
    q: z
      .string({ error: "Arama metni geçersiz." })
      .trim()
      .max(100, "Arama metni en fazla 100 karakter olabilir.")
      .optional(),
    minPrice: priceParam("En düşük fiyat"),
    maxPrice: priceParam("En yüksek fiyat"),
    inStock: z
      .enum(["true", "false"], { error: "Stok filtresi 'true' veya 'false' olmalı." })
      .optional()
      .transform((value) => value === "true"),
    minRatingCount: intParam("En az yorum sayısı", 0, 100_000, 0),
    sort: z.preprocess(
      emptyToUndefined,
      z.enum(PRODUCT_SORTS, { error: "Geçersiz sıralama seçeneği." }).default("newest"),
    ),
  })
  .refine((query) => query.minPrice === undefined || query.maxPrice === undefined || query.minPrice <= query.maxPrice, {
    error: "En düşük fiyat, en yüksek fiyattan büyük olamaz.",
  });

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
