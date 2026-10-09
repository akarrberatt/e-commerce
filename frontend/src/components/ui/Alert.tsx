import type { ReactNode } from 'react'

type AlertVariant = 'success' | 'error' | 'warning'

const styles: Record<AlertVariant, string> = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
}

interface AlertProps {
  variant: AlertVariant
  children: ReactNode
}

export function Alert({ variant, children }: AlertProps) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border px-4 py-3 text-sm ${styles[variant]}`}
    >
      {children}
    </div>
  )
}
