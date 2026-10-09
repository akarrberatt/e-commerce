import { LegalDocument } from '@/features/legal/components/LegalDocument'
import { termsSections } from '@/features/legal/terms'

export default function TermsPage() {
  return (
    <LegalDocument
      title="Kullanım Şartları"
      sections={termsSections}
      related={{ to: '/privacy', label: 'Gizlilik Politikası' }}
    />
  )
}
