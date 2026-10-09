import { api } from '@/lib/api'
import { env } from '@/lib/env'

import type { AuthResponse, LoginPayload, RegisterPayload } from './types'

// NOTE: endpoint paths and response shape are assumptions until the backend contract is final.
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', payload)
  return data
}

// Registration only creates the account; the session starts with the first login.
export async function register(payload: RegisterPayload): Promise<void> {
  await api.post('/auth/register', payload)
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

export async function verifyEmail(payload: { token: string }): Promise<void> {
  await api.post('/auth/verify-email', payload)
}

export async function resendVerification(payload: { email: string }): Promise<void> {
  await api.post('/auth/resend-verification', payload)
}

// NOTE: password reset endpoints are assumptions until the backend contract is final.
export async function forgotPassword(payload: { email: string }): Promise<void> {
  await api.post('/auth/forgot-password', payload)
}

export async function resetPassword(payload: { token: string; password: string }): Promise<void> {
  await api.post('/auth/reset-password', payload)
}

// NOTE: assumed contract. The backend runs the Google OAuth flow: this URL starts it, and the backend
// finishes by setting the refresh cookie and redirecting the browser to `/auth/callback`.
export const googleLoginUrl = `${env.apiUrl}/auth/google`
