import logoColor from '@/assets/logo/logo.png'
import logoMark from '@/assets/logo/logo-mark.png'
import logoWordmarkWhite from '@/assets/logo/logo-wordmark-white.png'
import { BRAND_NAME } from '@/lib/brand'

interface LogoProps {
  /** `color` for light backgrounds, `light` for dark/brand-coloured backgrounds. */
  variant?: 'color' | 'light'
  className?: string
}

export function Logo({ variant = 'color', className = '' }: LogoProps) {
  if (variant === 'color') {
    return <img src={logoColor} alt={BRAND_NAME} className={`h-10 w-auto ${className}`} />
  }

  // The coloured bag would blend into a brand-coloured background, so it sits on a white tile.
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-lg shadow-black/10">
        <img src={logoMark} alt="" className="h-9 w-auto" />
      </span>
      <img src={logoWordmarkWhite} alt={BRAND_NAME} className="h-9 w-auto" />
    </div>
  )
}
