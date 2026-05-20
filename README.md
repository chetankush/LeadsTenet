# LeadsTeNet

AI-powered cold-outreach platform: **upload an Excel lead list → Gemini personalizes an email for every lead → send via Resend**, with a dashboard for campaigns, analytics, custom sending domains, and subscription billing.

## Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Auth:** [Supabase Auth](https://supabase.com/docs/guides/auth) — email/password **and** Google OAuth (cookie-based SSR via `@supabase/ssr`)
- **Database:** [Supabase](https://supabase.com/) (Postgres + Row Level Security)
- **AI:** [Google Gemini](https://ai.google.dev/)
- **Email:** [Resend](https://resend.com/) (+ custom domain verification)
- **Payments:** [Dodo Payments](https://dodopayments.com/) (subscriptions, customer portal, webhooks)
- **UI:** Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/)

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment variables** — copy and fill in:
   ```bash
   cp .env.example .env
   ```
   See [Environment Variables](#environment-variables) below. `.env` is gitignored — never commit secrets.

3. **Apply the database schema** — run the SQL migrations in `supabase/migrations/` against your Supabase project (Supabase SQL editor or `supabase db push`). The latest migration (`20260521000001_supabase_auth_and_dodo.sql`) wires the schema to Supabase Auth and enables Row Level Security.

   > ⚠️ That migration **truncates `public.users`** (and cascades) because old rows were tied to Clerk identities. Run it on a fresh/dev database, or back up first.

4. **Configure auth providers** in the Supabase dashboard:
   - **Email/password:** Authentication → Providers → Email (enable; toggle "Confirm email" to taste).
   - **Google:** Authentication → Providers → Google (add your Google OAuth Client ID/Secret).
   - **Redirect URL:** Authentication → URL Configuration → add `http://localhost:3000/auth/callback` (and your production URL).

5. **Configure Dodo Payments:** create two subscription products (Pro, Enterprise) and a webhook pointing at `{APP_URL}/api/dodo/webhook`. Put the API key, webhook signing secret, and product IDs in `.env`.

6. **Run the dev server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

```env
# Core
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (Auth + DB)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # server-only, required by the Dodo webhook

# AI / Email
GEMINI_API_KEY=...
RESEND_API_KEY=...

# Dodo Payments
DODO_PAYMENTS_API_KEY=...
DODO_PAYMENTS_WEBHOOK_KEY=...
DODO_PAYMENTS_ENVIRONMENT=test_mode  # or live_mode
DODO_PRO_PRODUCT_ID=...
DODO_ENTERPRISE_PRODUCT_ID=...
```

## Project Structure

```
app/                 # App Router pages + API routes
  (auth)/            # sign-in / sign-up (Supabase email + Google)
  (dashboard)/       # authenticated dashboard
  auth/callback/     # OAuth / email-confirmation code exchange
  api/dodo/          # checkout, customer portal, webhook
components/          # UI + feature components
lib/                 # services (ai, email, domain, dodo, database)
utils/supabase/      # SSR client (server/client/middleware/admin)
supabase/migrations/ # SQL schema + RLS policies
```

## Auth flow

Sessions are stored in cookies and refreshed in `middleware.ts` (`utils/supabase/middleware.ts`). Server code uses `createClient()` from `utils/supabase/server.ts`; client components use `utils/supabase/client.ts`. Row Level Security keys every table off `auth.uid()` (`public.users.id == auth.users.id`).
