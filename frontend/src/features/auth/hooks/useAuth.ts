import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/stores/authStore'

import { forgotPassword, login, logout, register, resendVerification, resetPassword, verifyEmail } from '../api'
import type { LoginRouteState } from '../types'

export function useLogin() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation({
    mutationFn: login,
    onSuccess: ({ token, user }) => {
      setSession(token, user)
      navigate('/dashboard', { replace: true })
    },
  })
}

export function useRegister() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: register,
    onSuccess: (_, { email }) => {
      const state: LoginRouteState = { registeredEmail: email }
      navigate('/login', { replace: true, state })
    },
  })
}

export function useLogout() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((s) => s.clearSession)

  return useMutation({
    mutationFn: logout,
    // Clear locally even if the request fails, so the user is never stuck logged in.
    onSettled: () => {
      clearSession()
      navigate('/login', { replace: true })
    },
  })
}

export const useVerifyEmail = () => useMutation({ mutationFn: verifyEmail })
export const useResendVerification = () => useMutation({ mutationFn: resendVerification })
export const useForgotPassword = () => useMutation({ mutationFn: forgotPassword })

export function useResetPassword() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      const state: LoginRouteState = { passwordReset: true }
      navigate('/login', { replace: true, state })
    },
  })
}
