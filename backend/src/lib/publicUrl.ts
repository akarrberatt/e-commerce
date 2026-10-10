import { env } from "../config/env.js";

const BASE = env.PUBLIC_BASE_URL.replace(/\/+$/, "");

/**
 * Veritabanındaki görsel yolunu istemcinin kullanabileceği tam URL'e çevirir:
 * "http(s)://" ile başlayan olduğu gibi döner, "/" ile başlayan (ör. /static/products/x.jpg)
 * PUBLIC_BASE_URL ile birleştirilir.
 */
export function toPublicUrl(url: string): string;
export function toPublicUrl(url: string | null): string | null;
export function toPublicUrl(url: string | null): string | null {
  if (url === null) return null;
  return url.startsWith("/") ? `${BASE}${url}` : url;
}
