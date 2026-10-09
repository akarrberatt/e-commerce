export interface PasswordStrength {
  /** 1 (weak) to 4 (strong). */
  score: 1 | 2 | 3 | 4
  label: string
  /** The most useful next improvement, if any. */
  hint?: string
}

const LABELS: Record<PasswordStrength['score'], string> = {
  1: 'Zayıf',
  2: 'Orta',
  3: 'İyi',
  4: 'Güçlü',
}

/** Advisory only: the hard rule (min length) is enforced by `validatePassword` and the backend. */
export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) {
    return { score: 1, label: LABELS[1], hint: 'En az 8 karakter kullanın.' }
  }

  const mixedCase = /[a-zçğıöşü]/.test(password) && /[A-ZÇĞİÖŞÜ]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSymbol = /[^\p{L}\d]/u.test(password)
  const isLong = password.length >= 12

  const met = [mixedCase, hasDigit, hasSymbol, isLong].filter(Boolean).length
  const score = (1 + Math.min(met, 3)) as PasswordStrength['score']

  let hint: string | undefined
  if (score < 4) {
    if (!mixedCase) hint = 'Büyük ve küçük harf kullanın.'
    else if (!hasDigit) hint = 'Bir rakam ekleyin.'
    else if (!hasSymbol) hint = 'Bir sembol ekleyin (örn. ! ? #).'
    else if (!isLong) hint = 'Daha uzun bir şifre daha güvenlidir.'
  }

  return { score, label: LABELS[score], hint }
}
