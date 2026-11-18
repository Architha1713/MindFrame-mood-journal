# Project memory

## Product intent & audience

- Web app with user authentication, including sign-in, sign-up, and password recovery flows.
- Users land on a dashboard after successful authentication or password reset.
- Production-oriented; expected to be fully featured and polished.

## Brand personality & voice

- Polished and trustworthy in tone, appropriate for an auth-heavy product.
- UI copy uses friendly, clear language (e.g. "Choose a new password", guidance to check spam folder).

## Visual design & UX direction

- Tailwind CSS for styling; React hooks and JSX conventions.
- Lucide React icons used throughout, including for logos.
- Password inputs include a strength indicator on sign-up and reset pages.
- Auth pages share consistent styling conventions (layout, inputs, buttons, messaging).
- Post-action states show confirmation/error messaging inline rather than via toasts/alerts.
- Responsive and accessible defaults expected.

## Decisions, constraints & rationale

- Auth backend is Supabase; password recovery uses Supabase's built-in `resetPasswordForEmail` flow and recovery-link handling.
- AuthProvider wraps the app and manages session/recovery state via its auth listener; pages should rely on that rather than re-initializing Supabase clients.
- Routes added for `/forgot-password` and `/reset-password`; sign-in page links to forgot-password under the password field.
- After password reset, user is automatically signed in and redirected to dashboard.
- No UI/theme/icon packages beyond the template defaults (Tailwind, lucide-react) unless explicitly requested.
- Apostrophes in JSX text and string literals must be handled carefully to avoid parse errors.

## Open questions & assumptions

- Supabase reset emails currently use the default sender address; custom domain email templates not yet configured.
- Reset link expiry window is governed by Supabase defaults; UI provides a fallback to request a new link.
- Exact dashboard route/path assumed to exist and be post-auth destination.
- No custom email branding or localized templates implemented yet.