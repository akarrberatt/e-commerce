import { Link } from 'react-router-dom'

import { Logo } from '@/components/ui/Logo'
import { LEGAL_LAST_UPDATED } from '@/lib/company'

import type { LegalSection } from '../types'

interface LegalDocumentProps {
  title: string
  sections: LegalSection[]
  /** Link to the sibling document shown at the bottom. */
  related: { to: string; label: string }
}

export function LegalDocument({ title, sections, related }: LegalDocumentProps) {
  return (
    <main className="mx-auto max-w-3xl space-y-10 px-6 py-12 sm:py-16">
      <Link to="/" aria-label="Ana sayfa" className="inline-block">
        <Logo />
      </Link>

      <header className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-ink">{title}</h1>
        <p className="text-gray-500">Son güncelleme: {LEGAL_LAST_UPDATED}</p>
      </header>

      <div className="space-y-8">
        {sections.map((section, index) => (
          <section key={section.title} className="space-y-3">
            <h2 className="text-xl font-semibold text-ink">
              {index + 1}. {section.title}
            </h2>
            {section.blocks.map((block, i) =>
              block.type === 'p' ? (
                <p key={i} className="leading-7 text-gray-700">
                  {block.text}
                </p>
              ) : (
                <ul key={i} className="list-disc space-y-2 pl-6 leading-7 text-gray-700 marker:text-brand-700">
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ),
            )}
          </section>
        ))}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-6">
        <Link to={related.to} className="font-semibold text-brand-700 hover:underline">
          {related.label}
        </Link>
        <Link to="/register" className="text-gray-600 hover:underline">
          Kayıt ol ekranına dön
        </Link>
      </footer>
    </main>
  )
}
