import type { ReactNode } from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'

import { Logo } from '@/components/ui/Logo'
import { BRAND_NAME } from '@/lib/brand'

import { ShoppingVisual } from './ShoppingVisual'

const currentYear = new Date().getFullYear()

// Keep in sync with --animate-slide-out in index.css (plus a little slack).
const EXIT_FALLBACK_MS = 450

interface Leaving {
  path: string
  element: ReactNode
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Shared frame for the auth pages: the brand panel stays put while the form panel slides out to the
 * right and the next page slides in from the right.
 */
export function AuthShell() {
  const { pathname } = useLocation()
  const outlet = useOutlet()
  const previousPath = useRef(pathname)
  // The outlet rendered by the previous commit: what the old page looked like when it starts leaving.
  const previousOutlet = useRef(outlet)
  const [leaving, setLeaving] = useState<Leaving | null>(null)
  const [entering, setEntering] = useState(false)

  // Runs before paint, so the new page never flashes before the old one starts leaving.
  useLayoutEffect(() => {
    if (previousPath.current !== pathname && !prefersReducedMotion()) {
      setLeaving({ path: previousPath.current, element: previousOutlet.current })
    }
    previousPath.current = pathname
  }, [pathname])

  // Declared after the effect above so that one still sees the previous outlet.
  useLayoutEffect(() => {
    previousOutlet.current = outlet
  })

  function finishLeaving() {
    setLeaving(null)
    setEntering(true)
  }

  // Safety net in case the animationend event never fires (e.g. the tab is in the background).
  useEffect(() => {
    if (!leaving) return
    const timer = setTimeout(finishLeaving, EXIT_FALLBACK_MS)
    return () => clearTimeout(timer)
  }, [leaving])

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel: desktop only */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 p-10 text-white lg:flex lg:flex-col lg:pr-20 xl:p-12 xl:pr-24">
        <div aria-hidden className="absolute -top-24 -right-24 size-96 rounded-full bg-brand-400/30 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -left-16 size-96 rounded-full bg-brand-500/30 blur-3xl" />
        {/* Shades the edge next to the form so the panel sits behind it */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black/15 to-transparent" />

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
      <main className="relative z-10 flex flex-col justify-center overflow-hidden bg-white px-6 py-10 sm:px-12 lg:-ml-10 lg:rounded-l-4xl lg:shadow-[-24px_0_60px_-12px_rgba(60,20,10,0.3)]">
        <div aria-hidden className="absolute -top-32 -right-32 size-96 rounded-full bg-brand-100/70 blur-3xl" />

        <div className="relative mx-auto w-full max-w-md space-y-8">
          <Logo className="lg:hidden" />

          {/*
            While leaving, the old page keeps its key (so its state survives) and plays the exit animation;
            afterwards the new page mounts under its own key and plays the enter animation.
          */}
          <div
            key={leaving ? leaving.path : pathname}
            className={leaving ? 'motion-safe:animate-slide-out' : entering ? 'motion-safe:animate-slide-in' : undefined}
            onAnimationEnd={leaving ? finishLeaving : undefined}
          >
            {leaving ? leaving.element : outlet}
          </div>
        </div>
      </main>
    </div>
  )
}
