import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link } from 'react-router-dom'

import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { LockIcon } from '@/components/ui/icons'
import { TextField } from '@/components/ui/TextField'
import { getErrorMessage } from '@/lib/api'

import { useResetPassword } from '../hooks/useAuth'
import { validatePassword } from '../validation'

type Errors = Partial<Record<'password' | 'confirm', string>>

export function ResetPasswordForm({ token }: { token: string | null }) {
  const { mutate, isPending, error } = useResetPassword()
  const [errors, setErrors] = useState<Errors>({})

  if (!token) {
    return (
      <Alert variant="error">
        Geçersiz şifre sıfırlama bağlantısı.{' '}
        <Link to="/forgot-password" className="font-semibold underline">
          Yeni bağlantı isteyin.
        </Link>
      </Alert>
    )
  }

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const password = String(form.get('password') ?? '')
    const confirm = String(form.get('confirm') ?? '')

    const next: Errors = {
      password: validatePassword(password),
      confirm: confirm !== password ? 'Şifreler eşleşmiyor.' : undefined,
    }
    setErrors(next)
    if (next.password || next.confirm || !token) return
    mutate({ token, password })
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <TextField
        label="Yeni şifre"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="En az 8 karakter"
        icon={<LockIcon />}
        error={errors.password}
      />
      <TextField
        label="Yeni şifre (Tekrar)"
        name="confirm"
        type="password"
        autoComplete="new-password"
        placeholder="Şifrenizi tekrar girin"
        icon={<LockIcon />}
        error={errors.confirm}
      />
      {error && (
        <Alert variant="error">
          {getErrorMessage(error, 'Şifre güncellenemedi. Bağlantının süresi dolmuş olabilir.')}
        </Alert>
      )}
      <Button type="submit" loading={isPending}>
        {isPending ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
      </Button>
    </form>
  )
}
