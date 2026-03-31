# LeadGen AI — Documentation Index

## Overview

LeadGen AI is a SaaS platform for AI-powered lead generation and personalized email outreach. Built with Next.js 14, Supabase, OpenRouter AI, Resend, and Stripe.

## Documentation

| Document | Description |
|----------|-------------|
| [01 — System Architecture](./01-system-architecture.md) | High-level architecture, tech stack, service layer, auth flow, deployment |
| [02 — Data Flow Diagrams](./02-data-flow-diagrams.md) | Step-by-step data flow for all 10 major user flows |
| [03 — Platform Functionality](./03-platform-functionality.md) | Complete feature guide, API reference, component architecture |
| [04 — User Stories](./04-user-stories.md) | 30+ user stories organized by epic with acceptance criteria |
| [05 — Database Schema](./05-database-schema.md) | Table definitions, relationships, RLS policies, migrations |

## Quick Reference

### Tech Stack
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Auth:** Supabase Auth (Email/Password + Google/GitHub OAuth)
- **Database:** Supabase (PostgreSQL) with RLS
- **AI:** OpenRouter (Gemini 2.0 Flash default) via OpenAI SDK
- **Email:** Resend API
- **Payments:** Stripe (Free / Pro $49 / Enterprise $149)

### Key Directories
```
app/           → Pages and API routes (Next.js App Router)
components/    → Reusable UI components
lib/           → Business logic services
utils/supabase → Supabase client utilities
types/         → TypeScript type definitions
```

### Core Services
| Service | File | Purpose |
|---------|------|---------|
| DatabaseService | `lib/database-service.ts` | All CRUD operations (singleton) |
| AIService | `lib/ai-service.ts` | AI content generation |
| EmailService | `lib/email-service.ts` | Email delivery via Resend |
| StripeService | `lib/stripe-service.ts` | Billing and subscriptions |
| DomainService | `lib/domain-service.ts` | Custom email domain management |
