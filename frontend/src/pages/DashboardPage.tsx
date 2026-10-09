import { useLogout } from '@/features/auth/hooks/useAuth'

export default function DashboardPage() {
  const { mutate: logout, isPending } = useLogout()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <button
        onClick={() => logout()}
        disabled={isPending}
        className="text-sm text-brand-700 hover:underline disabled:opacity-60"
      >
        Çıkış Yap
      </button>
    </main>
  )
}
