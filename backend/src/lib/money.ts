// Para veritabanında kuruş cinsinden tam sayı tutulur; API'de TL olarak number döner.

export const CURRENCY = "TRY";

export function kurusToTl(kurus: number): number {
  return kurus / 100;
}

export function tlToKurus(tl: number): number {
  return Math.round(tl * 100);
}
