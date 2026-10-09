import { Navigate, Outlet } from 'react-router-dom'

import { useAuthStore } from '@/stores/authStore'

function SessionLoading({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div className={`flex items-center justify-center text-sm text-gray-500 ${fullScreen ? 'min-h-screen' : 'py-24'}`}>
      Yükleniyor...
    </div>
  )
}

/** Only authenticated users may pass. */
export function RequireAuth() {
  const status = useAuthStore((s) => s.status)
  if (status === 'loading') return <SessionLoading fullScreen />
  return status === 'authenticated' ? <Outlet /> : <Navigate to="/login" replace />
}

/** Only guests may pass (login/register). */
export function GuestOnly() {
  const status = useAuthStore((s) => s.status)
  if (status === 'loading') return <SessionLoading />
  return status === 'authenticated' ? <Navigate to="/dashboard" replace /> : <Outlet />
}
