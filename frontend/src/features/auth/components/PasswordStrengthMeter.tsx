import { getPasswordStrength } from '../passwordStrength'
import type { PasswordStrength } from '../passwordStrength'

const BAR: Record<PasswordStrength['score'], string> = {
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-yellow-500',
  4: 'bg-green-600',
}

const TEXT: Record<PasswordStrength['score'], string> = {
  1: 'text-red-600',
  2: 'text-orange-600',
  3: 'text-yellow-700',
  4: 'text-green-700',
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null
  const { score, label, hint } = getPasswordStrength(password)

  return (
    <div className="space-y-1.5">
      <div aria-hidden className="flex gap-1.5">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${step <= score ? BAR[score] : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <p aria-live="polite" className="text-sm text-gray-600">
        Şifre gücü: <span className={`font-semibold ${TEXT[score]}`}>{label}</span>
        {hint && <span> · {hint}</span>}
      </p>
    </div>
  )
}
