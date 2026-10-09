import type { InputHTMLAttributes, ReactNode } from 'react'
import { useId, useState } from 'react'

import { EyeIcon, EyeOffIcon } from './icons'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string | undefined
  /** Decorative icon shown inside the field, on the left. */
  icon?: ReactNode
  /** Small control shown opposite the label, e.g. a "forgot password" link. */
  labelAction?: ReactNode
}

export function TextField({ label, error, icon, labelAction, type, className = '', ...props }: TextFieldProps) {
  const id = useId()
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-semibold text-gray-800">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
            {icon}
          </span>
        )}
        <input
          id={id}
          type={isPassword && revealed ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`h-12 w-full rounded-xl border bg-white text-base text-gray-900 transition-colors outline-none placeholder:text-gray-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-gray-300 hover:border-gray-400'
          } ${icon ? 'pl-11' : 'pl-4'} ${isPassword ? 'pr-12' : 'pr-4'} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-pressed={revealed}
            aria-label={revealed ? 'Şifreyi gizle' : 'Şifreyi göster'}
            className="absolute inset-y-0 right-0 flex items-center rounded-r-xl px-3.5 text-gray-400 transition-colors hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none"
          >
            {revealed ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
