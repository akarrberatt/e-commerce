import { Link, useLocation } from 'react-router-dom'

import { AuthLayout } from '@/components/layout/AuthLayout'
import { LoginForm } from '@/features/auth/components/LoginForm'
import type { LoginRouteState } from '@/features/auth/types'

export default function LoginPage() {
  const state = useLocation().state as LoginRouteState | null
  const registeredEmail = state?.registeredEmail

  return (
    <AuthLayout
      title="Giriş Yap"
      footer={
        <>
          Hesabınız yok mu?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:underline">
            Kayıt Ol
          </Link>
        </>
      }
    >
      {registeredEmail && (
        <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          Kayıt başarılı. Lütfen e-postanıza gönderilen bağlantıyla hesabınızı doğrulayın, ardından giriş yapın.
        </p>
      )}
      <LoginForm defaultEmail={registeredEmail} />
    </AuthLayout>
  )
}
