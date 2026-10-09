export interface User {
  id: string
  name: string
  email: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

/** Router state passed to the login page (after register or password reset). */
export interface LoginRouteState {
  registeredEmail?: string
  /** Set after a successful password reset. */
  passwordReset?: boolean
}
