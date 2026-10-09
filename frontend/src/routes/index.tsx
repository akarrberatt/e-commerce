import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AuthShell } from '@/components/layout/AuthShell'
import AuthCallbackPage from '@/pages/AuthCallbackPage'
import DashboardPage from '@/pages/DashboardPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import PrivacyPage from '@/pages/PrivacyPage'
import RegisterPage from '@/pages/RegisterPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import TermsPage from '@/pages/TermsPage'
import VerifyEmailPage from '@/pages/VerifyEmailPage'

import { GuestOnly, RequireAuth } from './guards'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  {
    // Shared frame for every auth page, so the brand panel persists and only the form slides.
    element: <AuthShell />,
    children: [
      // Reachable regardless of session state: the links are opened from an email.
      { path: '/verify-email', element: <VerifyEmailPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      // Landing page after the backend finishes the Google OAuth flow.
      { path: '/auth/callback', element: <AuthCallbackPage /> },
      {
        element: <GuestOnly />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
        ],
      },
    ],
  },
  { path: '/terms', element: <TermsPage /> },
  { path: '/privacy', element: <PrivacyPage /> },
  {
    element: <RequireAuth />,
    children: [{ path: '/dashboard', element: <DashboardPage /> }],
  },
  { path: '*', element: <NotFoundPage /> },
])
