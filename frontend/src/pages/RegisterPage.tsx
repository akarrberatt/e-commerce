import { Link } from 'react-router-dom'

import { AuthLayout } from '@/components/layout/AuthLayout'
import { RegisterForm } from '@/features/auth/components/RegisterForm'

export default function RegisterPage() {
  return (
    <AuthLayout
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
    </AuthLayout>
  )
}
