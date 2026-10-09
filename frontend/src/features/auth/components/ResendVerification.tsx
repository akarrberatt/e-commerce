import { getErrorMessage } from '@/lib/api'

import { useResendVerification } from '../hooks/useAuth'

export function ResendVerification({ email }: { email: string }) {
  const { mutate, isPending, isSuccess, error } = useResendVerification()

  if (isSuccess) {
    return (
      <p role="status" className="text-sm text-green-700">
        Doğrulama e-postası tekrar gönderildi. Lütfen gelen kutunuzu kontrol edin.
      </p>
    )
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => mutate({ email })}
        disabled={isPending}
        className="text-sm font-medium text-indigo-600 hover:underline disabled:opacity-60"
      >
        {isPending ? 'Gönderiliyor...' : 'Doğrulama e-postasını tekrar gönder'}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {getErrorMessage(error)}
        </p>
      )}
    </div>
  )
}
