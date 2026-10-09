const apiUrl = import.meta.env.VITE_API_URL

if (!apiUrl) {
  throw new Error('VITE_API_URL is not defined. Copy .env.example to .env.development.')
}

export const env = {
  apiUrl,
} as const
