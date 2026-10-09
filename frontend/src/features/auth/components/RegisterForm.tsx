import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link } from 'react-router-dom'

import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { LockIcon, MailIcon, UserIcon } from '@/components/ui/icons'
import { TextField } from '@/components/ui/TextField'
import { getErrorMessage } from '@/lib/api'

import { useRegister } from '../hooks/useAuth'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'
import { SocialAuth } from './SocialAuth'
import { validateEmail, validatePassword, validateRequired } from '../validation'

type Errors = Partial<Record<'name' | 'email' | 'password' | 'confirm' | 'terms', string>>

export function RegisterForm() {
  const { mutate, isPending, error } = useRegister()
  const [errors, setErrors] = useState<Errors>({})
  const [typedPassword, setTypedPassword] = useState('')

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    const acceptedTerms = form.get('terms') === 'on'
    const confirm = String(form.get('confirm') ?? '')

    const next: Errors = {
      name: validateRequired(name, 'Ad soyad'),
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: confirm !== password ? 'Şifreler eşleşmiyor.' : undefined,
      terms: acceptedTerms ? undefined : 'Devam etmek için şartları kabul etmelisiniz.',
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    mutate({ name, email, password })
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <TextField
        label="Ad Soyad"
        name="name"
        autoComplete="name"
        placeholder="Adınız Soyadınız"
        icon={<UserIcon />}
        error={errors.name}
      />
      <TextField
        label="E-posta"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="ornek@eposta.com"
        icon={<MailIcon />}
        error={errors.email}
      />
      <TextField
        label="Şifre"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="En az 8 karakter"
        icon={<LockIcon />}
        onChange={(e) => setTypedPassword(e.target.value)}
        error={errors.password}
      />
      <div className="-mt-2">
        <PasswordStrengthMeter password={typedPassword} />
      </div>
      <TextField
        label="Şifre (Tekrar)"
        name="confirm"
        type="password"
        autoComplete="new-password"
        placeholder="Şifrenizi tekrar girin"
        icon={<LockIcon />}
        error={errors.confirm}
      />
      <Checkbox
        name="terms"
        error={errors.terms}
        label={
          <>
            <Link to="/terms" target="_blank" className="font-semibold text-brand-700 hover:underline">
              Kullanım Şartları
            </Link>{' '}
            ve{' '}
            <Link to="/privacy" target="_blank" className="font-semibold text-brand-700 hover:underline">
              Gizlilik Politikası
            </Link>
            &apos;nı okudum ve kabul ediyorum.
          </>
        }
      />
      {error && (
        <Alert variant="error">{getErrorMessage(error, 'Kayıt başarısız. Lütfen tekrar deneyin.')}</Alert>
      )}
      <Button type="submit" loading={isPending}>
        {isPending ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
      </Button>
      <SocialAuth label="Google ile kayıt ol" />
    </form>
  )
}
