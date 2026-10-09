import { useState } from 'react'
import type { SubmitEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { getErrorMessage, getErrorStatus } from '@/lib/api'

import { useLogin } from '../hooks/useAuth'
import { ResendVerification } from './ResendVerification'
import { validateEmail, validateRequired } from '../validation'

export function LoginForm({ defaultEmail }: { defaultEmail?: string | undefined }) {
  const { mutate, isPending, error, variables } = useLogin()
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')

    const next = { email: validateEmail(email), password: validateRequired(password, 'Şifre') }
    setErrors(next)
    if (next.email || next.password) return
    mutate({ email, password })
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <TextField
        label="E-posta"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={defaultEmail}
        error={errors.email}
      />
      <TextField
        label="Şifre"
        name="password"
        type="password"
        autoComplete="current-password"
        error={errors.password}
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {getErrorMessage(error, 'Giriş başarısız. Bilgilerinizi kontrol edin.')}
        </p>
      )}
      {getErrorStatus(error) === 403 && variables && <ResendVerification email={variables.email} />}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Giriş yapılıyor...' : 'Giriş Yap'}
      </Button>
    </form>
  )
}
