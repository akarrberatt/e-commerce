import type { ReactNode } from 'react'

interface AuthLayoutProps {
  title: string
  children: ReactNode
  footer: ReactNode
}

export function AuthLayout({ title, children, footer }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl bg-white p-8 shadow">
        <h1 className="text-center text-2xl font-semibold text-gray-900">{title}</h1>
        {children}
        <p className="text-center text-sm text-gray-600">{footer}</p>
      </div>
    </main>
  )
}
