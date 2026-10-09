import type { ButtonHTMLAttributes } from 'react'

import { ArrowRightIcon, SpinnerIcon } from './icons'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Shows a spinner instead of the arrow and blocks clicks. */
  loading?: boolean
}

export function Button({ loading = false, disabled, className = '', children, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand-700 px-4 text-base font-semibold text-white shadow-lg shadow-brand-700/25 transition-all duration-200 hover:bg-brand-650 hover:shadow-xl hover:shadow-brand-700/30 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 motion-safe:enabled:hover:-translate-y-0.5 motion-safe:enabled:active:translate-y-0 ${className}`}
      {...props}
    >
      {/* Light sweep across the button on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1/4 -translate-x-full -skew-x-12 bg-white/25 blur-sm motion-safe:group-enabled:group-hover:animate-shine"
      />
      <span className="relative">{children}</span>
      <span className="relative transition-transform duration-200 group-enabled:group-hover:translate-x-1">
        {loading ? <SpinnerIcon /> : <ArrowRightIcon />}
      </span>
    </button>
  )
}
