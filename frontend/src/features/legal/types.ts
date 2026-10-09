export type LegalBlock = { type: 'p'; text: string } | { type: 'ul'; items: string[] }

export interface LegalSection {
  title: string
  blocks: LegalBlock[]
}
