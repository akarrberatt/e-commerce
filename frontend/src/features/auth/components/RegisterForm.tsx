import { useState } from 'react'
import type { SubmitEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { getErrorMessage } from '@/lib/api'

import { useRegister } from '../hooks/useAuth'
import { validateEmail, validatePassword, validateRequired } from '../validation'

type Errors = Partial<Record<'name' | 'email' | 'password' | 'confirm', string>>

export function RegisterForm() {
  const { mutate, isPending, error } = useRegister()
  const [errors, setErrors] = useState<Errors>({})

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    const confirm = String(form.get('confirm') ?? '')

    const next: Errors = {
      name: validateRequired(name, 'Ad soyad'),
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: confirm !== password ? 'Şifreler eşleşmiyor.' : undefined,
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    mutate({ name, email, password })
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <TextField label="Ad Soyad" name="name" autoComplete="name" error={errors.name} />
      <TextField label="E-posta" name="email" type="email" autoComplete="email" error={errors.email} />
      <TextField
        label="Şifre"
        name="password"
        type="password"
        autoComplete="new-password"
        error={errors.password}
      />
      <TextField
        label="Şifre (Tekrar)"
        name="confirm"
        type="password"
        autoComplete="new-password"
        error={errors.confirm}
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {getErrorMessage(error, 'Kayıt başarısız. Lütfen tekrar deneyin.')}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
      </Button>
    </form>
  )
}
