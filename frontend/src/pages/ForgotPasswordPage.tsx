import { Link } from 'react-router-dom'

import { AuthCard } from '@/components/layout/AuthCard'
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Şifrenizi mi unuttunuz?"
      subtitle="E-posta adresinizi girin, size şifrenizi sıfırlamanız için bir bağlantı gönderelim."
      footer={
        <Link to="/login" className="font-semibold text-brand-700 hover:underline">
          Giriş sayfasına dön
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  )
}
