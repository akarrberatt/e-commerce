import { Link } from 'react-router-dom'

import { AuthLayout } from '@/components/layout/AuthLayout'
import { RegisterForm } from '@/features/auth/components/RegisterForm'

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Kayıt Ol"
      footer={
        <>
          Zaten hesabınız var mı?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            Giriş Yap
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  )
}
