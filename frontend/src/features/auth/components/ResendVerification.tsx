import { Alert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/api'

import { useResendVerification } from '../hooks/useAuth'

export function ResendVerification({ email }: { email: string }) {
  const { mutate, isPending, isSuccess, error } = useResendVerification()

  if (isSuccess) {
    return (
      <Alert variant="success">
        Doğrulama e-postası tekrar gönderildi. Lütfen gelen kutunuzu kontrol edin.
      </Alert>
    )
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => mutate({ email })}
        disabled={isPending}
        className="text-sm font-semibold text-brand-700 hover:underline disabled:opacity-60"
      >
        {isPending ? 'Gönderiliyor...' : 'Doğrulama e-postasını tekrar gönder'}
      </button>
      {error && (
        <Alert variant="error">{getErrorMessage(error)}</Alert>
      )}
    </div>
  )
}
