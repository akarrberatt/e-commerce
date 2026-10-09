import { LegalDocument } from '@/features/legal/components/LegalDocument'
import { privacySections } from '@/features/legal/privacy'

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Gizlilik Politikası"
      sections={privacySections}
      related={{ to: '/terms', label: 'Kullanım Şartları' }}
    />
  )
}
