import type { InputHTMLAttributes, ReactNode } from 'react'
import { useId } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  error?: string | undefined
}

export function Checkbox({ label, error, className = '', ...props }: CheckboxProps) {
  const id = useId()

  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`mt-0.5 size-5 shrink-0 cursor-pointer rounded accent-brand-700 ${className}`}
          {...props}
        />
        <label htmlFor={id} className="text-sm leading-6 text-gray-700">
          {label}
        </label>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
