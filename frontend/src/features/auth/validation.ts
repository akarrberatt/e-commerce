export function validateRequired(value: string, label: string): string | undefined {
  return value.trim() ? undefined : `${label} gerekli.`
}

export function validateEmail(value: string): string | undefined {
  if (!value) return 'E-posta gerekli.'
  return /^\S+@\S+\.\S+$/.test(value) ? undefined : 'Geçerli bir e-posta girin.'
}

export function validatePassword(value: string): string | undefined {
  if (!value) return 'Şifre gerekli.'
  return value.length >= 8 ? undefined : 'Şifre en az 8 karakter olmalı.'
}
