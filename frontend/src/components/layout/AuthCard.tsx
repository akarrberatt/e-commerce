import type { ReactNode } from 'react'

interface AuthCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  footer: ReactNode
}

/** Page content for the auth shell: heading, the form, and the link to the sibling page. */
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="text-lg text-gray-600">{subtitle}</p>}
      </header>

      {children}

      <p className="border-t border-gray-100 pt-6 text-center text-gray-600">{footer}</p>
    </div>
  )
}
