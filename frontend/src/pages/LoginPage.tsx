import { Link, useLocation } from 'react-router-dom'

import { Alert } from '@/components/ui/Alert'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { LoginForm } from '@/features/auth/components/LoginForm'
import type { LoginRouteState } from '@/features/auth/types'

export default function LoginPage() {
  const state = useLocation().state as LoginRouteState | null
  const registeredEmail = state?.registeredEmail

  return (
    <AuthLayout
      title="Tekrar hoş geldiniz"
      subtitle="Hesabınıza giriş yaparak alışverişe devam edin."
      footer={
        <>
          Hesabınız yok mu?{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline">
            Kayıt Ol
          </Link>
        </>
      }
    >
      {registeredEmail && (
        <Alert variant="success">
          Kayıt başarılı. Lütfen e-postanıza gönderilen bağlantıyla hesabınızı doğrulayın, ardından giriş yapın.
        </Alert>
      )}
      <LoginForm defaultEmail={registeredEmail} />
    </AuthLayout>
  )
}
