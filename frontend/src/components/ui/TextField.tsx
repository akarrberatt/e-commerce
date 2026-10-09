import type { InputHTMLAttributes } from 'react'
import { useId, useState } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string | undefined
}

export function TextField({ label, error, type, className = '', ...props }: TextFieldProps) {
  const id = useId()
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-800">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && revealed ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-gray-900 transition-colors outline-none placeholder:text-gray-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-200 ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-gray-300'
          } ${isPassword ? 'pr-16' : ''} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-pressed={revealed}
            className="absolute inset-y-0 right-0 rounded-r-lg px-3.5 text-xs font-medium text-gray-500 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none"
          >
            {revealed ? 'Gizle' : 'Göster'}
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
