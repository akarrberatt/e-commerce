import bcrypt from "bcryptjs";

const ROUNDS = 12;

// Kullanıcı bulunamadığında da karşılaştırma yapıp yanıt süresini eşitlemek için
// (yanıt süresinden "bu e-posta kayıtlı mı" bilgisi sızmasın).
const DUMMY_HASH = bcrypt.hashSync("timing-attack-dummy-password", ROUNDS);

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

export function verifyPassword(password: string, hash: string | null | undefined): Promise<boolean> {
  return bcrypt.compare(password, hash ?? DUMMY_HASH).then((ok) => ok && !!hash);
}
