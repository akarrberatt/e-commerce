import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'

import { Providers } from '@/app/providers'
import { refreshSession } from '@/lib/api'
import { router } from '@/routes'

export default function App() {
  // Restore the session from the httpOnly refresh cookie on first load.
  useEffect(() => {
    void refreshSession()
  }, [])

  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  )
}
