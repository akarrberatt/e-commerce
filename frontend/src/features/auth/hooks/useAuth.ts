import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/stores/authStore'

import { login, logout, register } from '../api'
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
