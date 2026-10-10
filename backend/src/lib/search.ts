// Türkçe karakter duyarsız arama: "KULAKLIK", "kulaklik" ve "Kulaklık" aynı sonucu verir.
// JS ve SQL tarafı aynı eşlemeyi kullanır; ikisi birlikte değiştirilmelidir.

const TR_FROM = "ıİIşŞğĞüÜöÖçÇ";
const TR_TO = "iiissgguuoocc";

const TR_MAP = new Map([...TR_FROM].map((ch, i) => [ch, TR_TO[i]!]));
const TR_PATTERN = new RegExp(`[${TR_FROM}]`, "g");

/** Türkçe harfleri ASCII karşılığına çevirir, sonra küçük harfe indirir. */
export function normalizeSearch(text: string): string {
  return text.replace(TR_PATTERN, (ch) => TR_MAP.get(ch) ?? ch).toLowerCase();
}

/** normalizeSearch'ün SQL karşılığı. translate, lower'dan önce çalışır ("I" → "i", "İ" → "i"). */
export function sqlNormalize(expression: string): string {
  return `lower(translate(${expression}, '${TR_FROM}', '${TR_TO}'))`;
}

/** LIKE kalıbındaki özel karakterleri (\ % _) düz metin olarak aratmak için kaçışlar. */
export function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, "\\$&");
}

/** Normalize edilmiş sütunla karşılaştırılacak LIKE kalıpları (ESCAPE '\' ile kullanılır). */
export function likePatterns(query: string) {
  const escaped = escapeLike(normalizeSearch(query));
  return { contains: `%${escaped}%`, startsWith: `${escaped}%` };
}
