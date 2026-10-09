import { Navigate, Outlet } from 'react-router-dom'

import { useAuthStore } from '@/stores/authStore'

function SessionLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center text-sm text-gray-500">
      Yükleniyor...
    </main>
  )
}

/** Only authenticated users may pass. */
export function RequireAuth() {
  const status = useAuthStore((s) => s.status)
  if (status === 'loading') return <SessionLoading />
  return status === 'authenticated' ? <Outlet /> : <Navigate to="/login" replace />
}

/** Only guests may pass (login/register). */
export function GuestOnly() {
  const status = useAuthStore((s) => s.status)
  if (status === 'loading') return <SessionLoading />
  return status === 'authenticated' ? <Navigate to="/dashboard" replace /> : <Outlet />
}
