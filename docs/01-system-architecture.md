# LeadGen AI — System Architecture

## Table of Contents
1. [High-Level Architecture](#high-level-architecture)
2. [Technology Stack](#technology-stack)
3. [Application Layer Architecture](#application-layer-architecture)
4. [Authentication Architecture](#authentication-architecture)
5. [Service Layer Architecture](#service-layer-architecture)
6. [Database Architecture](#database-architecture)
7. [External Integrations](#external-integrations)
8. [Deployment Architecture](#deployment-architecture)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                             │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Next.js App │  │  shadcn/ui   │  │  Supabase Browser Client │  │
│  │  (React 18)  │  │  + Tailwind  │  │  (@supabase/ssr)         │  │
│  └──────┬───────┘  └──────────────┘  └────────────┬─────────────┘  │
│         │                                          │                │
└─────────┼──────────────────────────────────────────┼────────────────┘
          │  HTTP / API Routes                       │  Auth (JWT cookies)
          ▼                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     NEXT.JS SERVER (App Router)                     │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────────────────┐   │
│  │ Middleware   │  │ API Routes  │  │ Server Components         │   │
│  │ (Auth Guard) │  │ (/api/*)    │  │ (SSR Pages)               │   │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬───────────────┘   │
│         │                │                      │                   │
│  ┌──────┴──────────────────────────────────────┴───────────────┐   │
│  │                   SERVICE LAYER                              │   │
│  │  ┌────────────┐ ┌──────────┐ ┌────────┐ ┌───────────────┐   │   │
│  │  │ Database   │ │ AI       │ │ Email  │ │ Stripe        │   │   │
│  │  │ Service    │ │ Service  │ │ Service│ │ Service       │   │   │
│  │  └─────┬──────┘ └────┬─────┘ └───┬────┘ └──────┬────────┘   │   │
│  └────────┼──────────────┼───────────┼─────────────┼────────────┘   │
│           │              │           │             │                 │
└───────────┼──────────────┼───────────┼─────────────┼────────────────┘
            │              │           │             │
            ▼              ▼           ▼             ▼
┌───────────────┐ ┌──────────────┐ ┌────────┐ ┌───────────┐
│   Supabase    │ │  OpenRouter  │ │ Resend │ │  Stripe   │
│  (PostgreSQL  │ │  (AI Models) │ │ (Email │ │ (Payments)│
│   + Auth)     │ │              │ │  API)  │ │           │
└───────────────┘ └──────────────┘ └────────┘ └───────────┘
```

---

## Technology Stack

| Layer         | Technology                     | Purpose                              |
|---------------|--------------------------------|--------------------------------------|
| Frontend      | Next.js 14 (App Router)        | React framework with SSR/SSG         |
| UI Library    | shadcn/ui + Radix UI           | Accessible component primitives      |
| Styling       | Tailwind CSS                   | Utility-first CSS                    |
| Language      | TypeScript                     | Type-safe JavaScript                 |
| Auth          | Supabase Auth                  | Email/password + OAuth (cookie-based)|
| Database      | Supabase (PostgreSQL)          | Primary data store with RLS          |
| AI            | OpenRouter (OpenAI SDK)        | Multi-model AI content generation    |
| Email         | Resend                         | Transactional email delivery         |
| Payments      | Stripe                         | Subscription billing                 |
| File Parsing  | Papa Parse                     | CSV parsing for lead uploads         |
| Deployment    | Vercel (likely)                | Serverless Next.js hosting           |

---

## Application Layer Architecture

### Directory Structure

```
LeadGen-Ai/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (ThemeProvider, Toaster)
│   ├── page.tsx                  # Landing page
│   ├── (auth)/                   # Auth route group
│   │   ├── sign-in/page.tsx      # Sign-in form
│   │   └── sign-up/page.tsx      # Sign-up form
│   ├── auth/callback/route.ts    # OAuth callback handler
│   ├── (dashboard)/              # Protected dashboard route group
│   │   ├── layout.tsx            # Dashboard layout (auth guard)
│   │   └── dashboard/
│   │       ├── page.tsx          # Main dashboard
│   │       ├── campaigns/        # Campaign management
│   │       ├── upload/           # Lead upload (CSV)
│   │       ├── templates/        # Email template editor
│   │       ├── email-example/    # Email preview
│   │       ├── profile/          # User profile
│   │       ├── settings/         # User settings
│   │       ├── pricing/          # Subscription plans
│   │       └── domains/          # Custom email domains
│   └── api/                      # API routes (19 endpoints)
│       ├── user/                 # User management
│       ├── campaigns/            # Campaign CRUD
│       ├── process-campaign/     # Campaign execution
│       ├── templates/            # Template CRUD
│       ├── sample-email/         # AI email preview
│       ├── dashboard/            # Dashboard analytics
│       └── stripe/               # Payment webhooks
├── components/                   # Reusable UI components
│   ├── dashboard/                # Dashboard-specific components
│   ├── ui/                       # shadcn/ui base components
│   └── providers/                # Context providers
├── lib/                          # Business logic / services
│   ├── database-service.ts       # Database operations singleton
│   ├── ai-service.ts             # AI content generation
│   ├── email-service.ts          # Email delivery via Resend
│   ├── stripe-service.ts         # Stripe billing
│   ├── domain-service.ts         # Custom domain management
│   └── types/                    # TypeScript type definitions
├── utils/supabase/               # Supabase client utilities
│   ├── client.ts                 # Browser client
│   ├── server.ts                 # Server client (cookies)
│   ├── admin.ts                  # Service role client
│   └── context.tsx               # React context provider
├── types/                        # Database types (generated)
└── middleware.ts                  # Route protection middleware
```

### Rendering Strategy

| Page Type        | Rendering  | Example                          |
|------------------|------------|----------------------------------|
| Landing page     | SSR        | `/` (app/page.tsx)               |
| Auth pages       | Client     | `/sign-in`, `/sign-up`           |
| Dashboard pages  | Client     | `/dashboard/*`                   |
| API routes       | Server     | `/api/*`                         |

---

## Authentication Architecture

### Auth Flow

```
┌──────────┐    1. Sign in/up    ┌──────────────┐
│  Browser  │ ──────────────────▶│ Supabase Auth │
│  Client   │                    │   Server      │
│           │◀──────────────────│               │
└─────┬─────┘  2. Set cookies    └───────────────┘
      │              (JWT + refresh token)
      │
      │  3. Every request
      ▼
┌──────────────┐  4. Verify JWT   ┌──────────────┐
│  Next.js     │ ────────────────▶│ Supabase Auth │
│  Middleware   │                  │               │
│              │◀────────────────│               │
└──────┬───────┘  5. Refresh if   └──────────────┘
       │             expired
       │
       │  6. Pass to route
       ▼
┌──────────────┐
│  API Route / │
│  Page        │
│  (getUser()) │
└──────────────┘
```

### Three Supabase Client Types

| Client          | File                        | Use Case                              | Key                     |
|-----------------|-----------------------------|---------------------------------------|-------------------------|
| Browser Client  | `utils/supabase/client.ts`  | Client-side auth, real-time           | ANON_KEY                |
| Server Client   | `utils/supabase/server.ts`  | Server components, API routes (auth)  | ANON_KEY + cookies      |
| Admin Client    | `utils/supabase/admin.ts`   | Service role operations (bypass RLS)  | SERVICE_ROLE_KEY        |

### Middleware Protected Routes

```
middleware.ts
├── Match: /dashboard/* (all dashboard routes)
├── Action: supabase.auth.getUser()
├── If no user → redirect to /sign-in
└── If authenticated → continue to route
```

---

## Service Layer Architecture

### Service Dependencies

```
┌─────────────────────────────────────────────────────┐
│                    API Routes                        │
│  (user, campaigns, templates, stripe, dashboard)     │
└───────────┬──────────┬──────────┬───────────┬───────┘
            │          │          │           │
            ▼          ▼          ▼           ▼
     ┌──────────┐ ┌─────────┐ ┌───────┐ ┌────────┐
     │ Database │ │   AI    │ │ Email │ │ Stripe │
     │ Service  │ │ Service │ │Service│ │Service │
     │(Singleton│ │(Lazy    │ │       │ │(Static │
     │  class)  │ │ init)   │ │       │ │methods)│
     └────┬─────┘ └────┬────┘ └───┬───┘ └───┬────┘
          │            │          │          │
          ▼            ▼          ▼          ▼
     Supabase     OpenRouter    Resend    Stripe
     (PostgreSQL)  (AI API)    (Email)   (Billing)
```

### DatabaseService (lib/database-service.ts)
- **Pattern**: Singleton with user context
- **Initialization**: `await DatabaseService.create()` reads auth user from Supabase server client
- **Operations**: CRUD for users, campaigns, leads, email logs, templates, domains
- **Client**: Uses admin (service role) client for all DB operations

### AIService (lib/ai-service.ts)
- **Pattern**: Lazy-initialized singleton
- **Provider**: OpenRouter (OpenAI-compatible API)
- **Default Model**: `google/gemini-2.0-flash-001`
- **Channels**: Email, LinkedIn, Twitter content generation
- **Features**: Dynamic field extraction, confidence scoring, fallback templates

### EmailService (lib/email-service.ts)
- **Provider**: Resend API
- **Features**: Rate limiting, custom domain support, CAN-SPAM compliance
- **Tracking**: Logs sent/failed/bounced status to `email_logs` table

### StripeService (lib/stripe-service.ts)
- **Pattern**: Static methods class
- **Features**: Checkout sessions, customer portal, subscription management
- **Plans**: Free ($0), Pro ($49/mo), Enterprise ($149/mo)
- **Webhook**: Signature verification for event handling

### DomainService (lib/domain-service.ts)
- **Features**: Custom email domain verification via Resend
- **Status Tracking**: pending → verified / failed

---

## Database Architecture

### Entity Relationship Diagram

```
                         ┌──────────────┐
                         │    users     │
                         │──────────────│
                         │ id (PK)      │
                         │ auth_user_id │◄─── Supabase Auth UUID
                         │ email        │
                         │ full_name    │
                         │ plan_type    │
                         │ stripe_*     │
                         └──────┬───────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
            ▼                   ▼                   ▼
    ┌───────────────┐  ┌───────────────┐   ┌──────────────────┐
    │  campaigns    │  │ user_template │   │ custom_email     │
    │───────────────│  │ _cart         │   │ _domains         │
    │ id (PK)       │  │───────────────│   │──────────────────│
    │ user_id (FK)  │  │ user_id (FK)  │   │ user_id (FK)     │
    │ name          │  │ template_id   │   │ domain           │
    │ status        │  │ is_favorite   │   │ verification_    │
    │ from_email    │  └───────┬───────┘   │ status           │
    │ from_name     │          │           └──────────────────┘
    └──────┬────────┘          │
           │                   │
     ┌─────┴──────┐           ▼
     │            │   ┌───────────────┐
     ▼            ▼   │ email_        │
┌─────────┐ ┌────────│ templates     │
│  leads  │ │email_  │───────────────│
│─────────│ │logs    │ id (PK)       │
│ id (PK) │ │────────│ name          │
│campaign │ │id (PK) │ content       │
│ _id(FK) │ │campaign│ mood_tags     │
│ email   │ │ _id(FK)│ scenario      │
│ name    │ │lead_id │ variables     │
│ company │ │ (FK)   │ is_system     │
│ status  │ │status  │ created_by    │
└─────────┘ │from_   └───────┬───────┘
            │email   │       │
            └────────┘       ▼
                     ┌───────────────┐
                     │ campaign_     │
                     │ templates     │
                     │───────────────│
                     │ campaign_id   │
                     │ template_id   │
                     │ split_%       │
                     │ is_active     │
                     └───────────────┘
```

### Key Tables

| Table                  | Purpose                              | Records              |
|------------------------|--------------------------------------|-----------------------|
| `users`                | User profiles and subscription info  | 1 per user            |
| `campaigns`            | Email campaign definitions           | Many per user         |
| `leads`                | Uploaded contact data                | Many per campaign     |
| `email_logs`           | Sent email tracking                  | 1 per email sent      |
| `email_templates`      | Reusable email templates             | System + user-created |
| `user_template_cart`   | User's saved/favorite templates      | Many per user         |
| `campaign_templates`   | Template-campaign assignments        | Many-to-many          |
| `custom_email_domains` | Verified sender domains              | Many per user         |

---

## External Integrations

### Integration Map

```
┌──────────────────────────────────────────────────────────────┐
│                      LeadGen AI Platform                      │
│                                                                │
│  ┌────────────┐    ┌─────────────┐    ┌──────────────────┐    │
│  │ Auth Flow  │    │ AI Content  │    │ Email Delivery   │    │
│  │            │    │ Generation  │    │                  │    │
│  └─────┬──────┘    └──────┬──────┘    └────────┬─────────┘    │
│        │                  │                     │              │
└────────┼──────────────────┼─────────────────────┼──────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
  ┌──────────────┐  ┌──────────────┐     ┌──────────────┐
  │ Supabase     │  │ OpenRouter   │     │ Resend       │
  │ Auth         │  │              │     │              │
  │──────────────│  │──────────────│     │──────────────│
  │ Email/Pass   │  │ Gemini 2.0   │     │ Email API    │
  │ Google OAuth │  │ Flash        │     │ Domain verify│
  │ GitHub OAuth │  │ (default)    │     │ Rate limiting│
  │ JWT tokens   │  │ Any OpenAI-  │     │ Webhook      │
  │ Cookie-based │  │ compatible   │     │ tracking     │
  └──────────────┘  └──────────────┘     └──────────────┘

         ┌──────────────┐
         │ Stripe       │
         │──────────────│
         │ Subscriptions│
         │ Checkout     │
         │ Customer     │
         │ Portal       │
         │ Webhooks     │
         └──────────────┘
```

### API Keys Required

| Service      | Environment Variable                     | Purpose                    |
|--------------|------------------------------------------|----------------------------|
| Supabase     | `NEXT_PUBLIC_SUPABASE_URL`               | Database & Auth URL        |
| Supabase     | `NEXT_PUBLIC_SUPABASE_ANON_KEY`          | Public anon key            |
| Supabase     | `SUPABASE_SERVICE_ROLE_KEY`              | Admin operations           |
| OpenRouter   | `OPENROUTER_API_KEY`                     | AI content generation      |
| OpenRouter   | `OPENROUTER_MODEL`                       | Model selection (optional) |
| Resend       | `RESEND_API_KEY`                         | Email delivery             |
| Stripe       | `STRIPE_SECRET_KEY`                      | Server-side billing        |
| Stripe       | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`     | Client-side checkout       |
| Stripe       | `STRIPE_WEBHOOK_SECRET`                  | Webhook verification       |
| Stripe       | `STRIPE_PRO_PRICE_ID`                    | Pro plan price ID          |
| Stripe       | `STRIPE_ENTERPRISE_PRICE_ID`             | Enterprise plan price ID   |

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│                  Vercel / Host                   │
│                                                   │
│  ┌─────────────┐    ┌──────────────────────────┐ │
│  │ Edge Runtime│    │ Serverless Functions      │ │
│  │             │    │                          │ │
│  │ middleware  │    │ API Routes (/api/*)      │ │
│  │ .ts         │    │ Server Components        │ │
│  │             │    │                          │ │
│  └─────────────┘    └──────────────────────────┘ │
│                                                   │
│  ┌──────────────────────────────────────────────┐ │
│  │ Static Assets                                │ │
│  │ Client-side JavaScript bundles               │ │
│  │ CSS (Tailwind)                               │ │
│  └──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
         │           │           │           │
         ▼           ▼           ▼           ▼
     Supabase    OpenRouter    Resend      Stripe
     (managed)   (managed)    (managed)   (managed)
```

All external services are fully managed SaaS — no infrastructure to maintain.
