import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'

import type { AuthResponse } from '@/features/auth/types'
import { env } from '@/lib/env'
import { useAuthStore } from '@/stores/authStore'

// withCredentials lets the browser send/receive the httpOnly refresh cookie.
export const api = axios.create({
  baseURL: env.apiUrl,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Bare client without interceptors, so a failing refresh can never loop.
const refreshClient = axios.create({ baseURL: env.apiUrl, withCredentials: true })

let refreshPromise: Promise<AuthResponse | null> | null = null

/**
 * Exchanges the httpOnly refresh cookie for a new access token.
 * Concurrent callers share one request. Resolves null if there is no valid session.
 */
export function refreshSession(): Promise<AuthResponse | null> {
  refreshPromise ??= refreshClient
    .post<AuthResponse>('/auth/refresh')
    .then(({ data }) => {
      useAuthStore.getState().setSession(data.token, data.user)
      return data
    })
    .catch(() => {
      useAuthStore.getState().clearSession()
      return null
    })
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && error.config) {
      const config: RetryableConfig = error.config
      const isAuthCall = config.url?.startsWith('/auth/')
      // Access token expired on a protected call: refresh once, then replay the request.
      if (!isAuthCall && !config._retried && useAuthStore.getState().token) {
        config._retried = true
        const session = await refreshSession()
        if (session) return api(config)
      }
    }
    return Promise.reject(error)
  },
)

export function getErrorMessage(error: unknown, fallback = 'Bir hata oluştu. Lütfen tekrar deneyin.'): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: unknown } | undefined)?.message
    if (typeof message === 'string') return message
    if (!error.response) return 'Sunucuya ulaşılamıyor.'
  }
  return fallback
}

export function getErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined
}
