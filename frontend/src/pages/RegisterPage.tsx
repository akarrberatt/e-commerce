import { Link } from 'react-router-dom'

import { AuthCard } from '@/components/layout/AuthCard'
import { RegisterForm } from '@/features/auth/components/RegisterForm'

export default function RegisterPage() {
  return (
    <AuthCard
      title="Hesap oluşturun"
      subtitle="Birkaç adımda üye olun, alışverişe hemen başlayın."
      footer={
        <>
          Zaten hesabınız var mı?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            Giriş Yap
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  )
}
