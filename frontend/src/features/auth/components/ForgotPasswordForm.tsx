import { useState } from 'react'
import type { SubmitEvent } from 'react'

import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { MailIcon } from '@/components/ui/icons'
import { TextField } from '@/components/ui/TextField'
import { getErrorMessage } from '@/lib/api'

import { useForgotPassword } from '../hooks/useAuth'
import { validateEmail } from '../validation'

export function ForgotPasswordForm() {
  const { mutate, isPending, isSuccess, error } = useForgotPassword()
  const [emailError, setEmailError] = useState<string | undefined>()

  // Same message whether or not the address exists, so accounts cannot be enumerated.
  if (isSuccess) {
    return (
      <Alert variant="success">
        E-posta adresiniz kayıtlıysa, şifre sıfırlama bağlantısı gönderildi. Lütfen gelen kutunuzu kontrol edin.
      </Alert>
    )
  }

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const email = String(new FormData(e.currentTarget).get('email') ?? '').trim()
    const invalid = validateEmail(email)
    setEmailError(invalid)
    if (!invalid) mutate({ email })
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <TextField
        label="E-posta"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="ornek@eposta.com"
        icon={<MailIcon />}
        error={emailError}
      />
      {error && <Alert variant="error">{getErrorMessage(error)}</Alert>}
      <Button type="submit" loading={isPending}>
        {isPending ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
      </Button>
    </form>
  )
}
