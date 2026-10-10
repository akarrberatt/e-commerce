import { z } from "zod";

// Query değerleri string gelir; boş değer (?minPrice=) "verilmedi" sayılır.
const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const intParam = (label: string, min: number, max: number, fallback: number) =>
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

export const PRODUCT_SORTS = ["newest", "price_asc", "price_desc", "rating", "discount"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const listProductsQuerySchema = z
  .object({
    page: intParam("Sayfa numarası", 1, Number.MAX_SAFE_INTEGER, 1),
    limit: intParam("Sayfa boyutu", 1, 50, 20),
    category: z
      .string({ error: "Kategori geçersiz." })
      .trim()
      .max(100, "Kategori geçersiz.")
      .optional(),
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
    sort: z.preprocess(
      emptyToUndefined,
      z.enum(PRODUCT_SORTS, { error: "Geçersiz sıralama seçeneği." }).default("newest"),
    ),
  })
  .refine((query) => query.minPrice === undefined || query.maxPrice === undefined || query.minPrice <= query.maxPrice, {
    error: "En düşük fiyat, en yüksek fiyattan büyük olamaz.",
  });

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
