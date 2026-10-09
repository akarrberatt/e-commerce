import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

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
    content = <p role="alert" className="text-center text-sm text-red-600">Geçersiz doğrulama bağlantısı.</p>
  } else if (isSuccess) {
    content = (
      <p role="status" className="text-center text-sm text-green-700">
        E-posta adresiniz doğrulandı. Artık giriş yapabilirsiniz.
      </p>
    )
  } else if (error) {
    content = (
      <p role="alert" className="text-center text-sm text-red-600">
        {getErrorMessage(error, 'Doğrulama başarısız. Bağlantının süresi dolmuş olabilir.')}
      </p>
    )
  } else {
    content = <p className="text-center text-sm text-gray-500">Doğrulanıyor...</p>
  }

  return (
    <AuthLayout
      title="E-posta Doğrulama"
      footer={
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
          Giriş sayfasına git
        </Link>
      }
    >
      {content}
    </AuthLayout>
  )
}
