import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { Alert } from '@/components/ui/Alert'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { useVerifyEmail } from '@/features/auth/hooks/useAuth'
import { getErrorMessage } from '@/lib/api'

export default function VerifyEmailPage() {
  const token = useSearchParams()[0].get('token')
  const { mutate, isSuccess, error } = useVerifyEmail()

  // The backend answers 200 even if the link is opened twice, so a repeated call is harmless.
  useEffect(() => {
    if (token) mutate({ token })
  }, [token, mutate])

  let content
  if (!token) {
    content = <Alert variant="error">Geçersiz doğrulama bağlantısı.</Alert>
  } else if (isSuccess) {
    content = (
      <Alert variant="success">E-posta adresiniz doğrulandı. Artık giriş yapabilirsiniz.</Alert>
    )
  } else if (error) {
    content = (
      <Alert variant="error">
        {getErrorMessage(error, 'Doğrulama başarısız. Bağlantının süresi dolmuş olabilir.')}
      </Alert>
    )
  } else {
    content = <p className="text-sm text-gray-500">Doğrulanıyor...</p>
  }

  return (
    <AuthLayout
      title="E-posta doğrulama"
      footer={
        <Link to="/login" className="font-semibold text-brand-700 hover:underline">
          Giriş sayfasına git
        </Link>
      }
    >
      {content}
    </AuthLayout>
  )
}
