# Vitrin – Frontend

React 19 + TypeScript (strict) + Vite + Tailwind CSS v4.
Routing: React Router · Server state: TanStack Query · Client state: Zustand · HTTP: Axios.

## Getting started

```bash
cd frontend
npm install
cp .env.example .env.local   # optional: override the API URL for your machine
npm run dev                  # http://localhost:5173
```

## Environment variables

| Variable       | Description              | Default                     |
| -------------- | ------------------------ | --------------------------- |
| `VITE_API_URL` | Backend API base URL     | `http://localhost:8000/api` |

`.env.development` holds the shared default. Put machine-specific values in `.env.local` (git-ignored).

## Scripts

| Script              | What it does                    |
| ------------------- | ------------------------------- |
| `npm run dev`       | Start the dev server            |
| `npm run typecheck` | Type-check the whole project    |
| `npm run lint`      | Lint with oxlint                |
| `npm run build`     | Type-check and build for prod   |

## Structure

```
src/
  app/          App root and global providers
  assets/       Static assets imported by code (logo variants)
  components/   Shared UI (ui/) and page layouts (layout/)
  features/     Feature modules, e.g. auth/ (api, hooks, components, types)
  lib/          Axios instance, query client, env, brand constants
  pages/        Route-level pages
  routes/       Router definition and route guards
  stores/       Zustand stores
```

Import from `src` with the `@/` alias, e.g. `import { api } from '@/lib/api'`.

## Authentication

- Access token (JWT) lives **in memory only**; it is never written to `localStorage`/`sessionStorage`.
- The refresh token is an httpOnly cookie set by the backend (`Path=/api/auth`).
- On page load the app calls `POST /auth/refresh` to restore the session.
- A `401` on a protected request triggers one refresh and a retry.
- Register does not log the user in; the session starts at the first successful login, after email verification.

Expected endpoints: `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`,
`/auth/verify-email`, `/auth/resend-verification`, `/auth/forgot-password` (`{ email }`) and
`/auth/reset-password` (`{ token, password }`). Errors are `{ "message": string }`.
Google sign-in: the button links to `GET /auth/google`; the backend runs the OAuth flow, sets the refresh cookie and redirects to `/auth/callback`.
Email links open frontend pages: `/verify-email?token=...` and `/reset-password?token=...`.

## Branding

- Brand name: `src/lib/brand.ts`. Colours (`brand-*`, `ink`) are sampled from the logo and defined in `src/index.css`.
- Logo variants are in `src/assets/logo/`; use the `Logo` component (`variant="color"` on light backgrounds, `"light"` on brand-coloured ones).
- Use `brand-700` or darker for text and for backgrounds under white text (WCAG AA).
