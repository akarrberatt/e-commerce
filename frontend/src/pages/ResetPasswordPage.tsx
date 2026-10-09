import { Link, useSearchParams } from 'react-router-dom'

import { AuthCard } from '@/components/layout/AuthCard'
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm'

export default function ResetPasswordPage() {
  const token = useSearchParams()[0].get('token')

  return (
    <AuthCard
      title="Yeni şifre belirleyin"
      subtitle="Hesabınız için yeni bir şifre seçin."
      footer={
        <Link to="/login" className="font-semibold text-brand-700 hover:underline">
          Giriş sayfasına dön
        </Link>
      }
    >
      <ResetPasswordForm token={token} />
    </AuthCard>
  )
}
