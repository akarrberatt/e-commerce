import type { ReactNode } from 'react'

import { Logo } from '@/components/ui/Logo'
import { BRAND_NAME } from '@/lib/brand'

import { ShoppingVisual } from './ShoppingVisual'

const currentYear = new Date().getFullYear()

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  footer: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel: desktop only */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 p-10 text-white lg:flex lg:flex-col xl:p-12">
        <div aria-hidden className="absolute -top-24 -right-24 size-96 rounded-full bg-brand-400/30 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -left-16 size-96 rounded-full bg-brand-500/30 blur-3xl" />

        <div className="relative space-y-10">
          <Logo variant="light" />
          <div className="max-w-md space-y-3">
            <h2 className="text-4xl leading-tight font-bold tracking-tight text-balance">
              Alışverişin keyfini yeniden keşfedin.
            </h2>
            <p className="text-lg text-brand-100">Size özel fırsatlar, hızlı ödeme ve kolay sipariş takibi.</p>
          </div>
        </div>

        <div className="relative flex flex-1 items-center py-8">
          <div className="w-full">
            <ShoppingVisual />
          </div>
        </div>

        <p className="relative text-sm text-brand-100">
          © {currentYear} {BRAND_NAME}
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col justify-center px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-sm space-y-8">
          <Logo className="lg:hidden" />

          <header className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
            {subtitle && <p className="text-gray-600">{subtitle}</p>}
          </header>

          {children}

          <p className="text-center text-sm text-gray-600">{footer}</p>
        </div>
      </main>
    </div>
  )
}
