import { Link, Navigate } from 'react-router-dom'

import { AuthCard } from '@/components/layout/AuthCard'
import { Alert } from '@/components/ui/Alert'
import { useAuthStore } from '@/stores/authStore'

/**
 * Where the backend sends the browser after Google sign-in. By then the refresh cookie is set, and the
 * app-wide session restore (see App) turns it into an access token, so this page only reacts to the result.
 */
export default function AuthCallbackPage() {
  const status = useAuthStore((s) => s.status)

  if (status === 'authenticated') return <Navigate to="/dashboard" replace />

  return (
    <AuthCard
      title="Google ile giriş"
      footer={
        <Link to="/login" className="font-semibold text-brand-700 hover:underline">
          Giriş sayfasına dön
        </Link>
      }
    >
      {status === 'loading' ? (
        <p className="text-gray-500">Giriş yapılıyor...</p>
      ) : (
        <Alert variant="error">Google ile giriş tamamlanamadı. Lütfen tekrar deneyin.</Alert>
      )}
    </AuthCard>
  )
}
