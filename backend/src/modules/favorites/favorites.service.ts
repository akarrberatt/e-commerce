import { withTransaction } from "../../db/pool.js";
import { HttpError } from "../../lib/httpError.js";
import { toSummary, type ProductList } from "../products/products.service.js";
import {
  adjustFavoriteCount,
  countFavoriteProducts,
  deleteFavorite,
  findActiveProductFavoriteCount,
  findFavoriteProducts,
  insertFavorite,
} from "./favorites.repository.js";

export interface FavoriteState {
  isFavorite: boolean;
  favoriteCount: number;
}

/** İdempotent: istenen durum zaten geçerliyse sayaç değişmez. Sayaç aynı transaction içinde güncellenir. */
async function setFavorite(userId: string, productId: string, isFavorite: boolean): Promise<FavoriteState> {
  return withTransaction(async (db) => {
    const current = await findActiveProductFavoriteCount(productId, db);
    if (current === null) throw new HttpError(404, "Ürün bulunamadı.", "NOT_FOUND");

    const changed = isFavorite
      ? await insertFavorite(userId, productId, db)
      : await deleteFavorite(userId, productId, db);
    const favoriteCount = changed ? await adjustFavoriteCount(productId, isFavorite ? 1 : -1, db) : current;
    return { isFavorite, favoriteCount };
  });
}

export const addFavorite = (userId: string, productId: string) => setFavorite(userId, productId, true);
export const removeFavorite = (userId: string, productId: string) => setFavorite(userId, productId, false);

export async function listFavorites(userId: string, page: number, limit: number): Promise<ProductList> {
  const [rows, total] = await Promise.all([
    findFavoriteProducts(userId, limit, (page - 1) * limit),
    countFavoriteProducts(userId),
  ]);
  return {
    items: rows.map(toSummary),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
