import { create } from 'zustand'

import type { User } from '@/features/auth/types'

/** 'loading' until the first session restore attempt (refresh cookie) finishes. */
type AuthStatus = 'loading' | 'authenticated' | 'guest'

interface AuthState {
  status: AuthStatus
  // Kept in memory only: never persisted to localStorage/sessionStorage.
  token: string | null
  user: User | null
  setSession: (token: string, user: User) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'loading',
  token: null,
  user: null,
  setSession: (token, user) => set({ status: 'authenticated', token, user }),
  clearSession: () => set({ status: 'guest', token: null, user: null }),
}))
