# LeadGen AI — Platform Functionality Guide

## Table of Contents
1. [Platform Overview](#platform-overview)
2. [Core Features](#core-features)
3. [Feature Details](#feature-details)
4. [API Reference](#api-reference)
5. [Component Architecture](#component-architecture)

---

## Platform Overview

LeadGen AI is a SaaS platform for automated lead generation and personalized email outreach. It combines CSV-based lead management with AI-powered content personalization and automated email delivery.

### Core Value Proposition
- Upload leads from CSV files
- AI generates personalized email content per lead
- Automated email campaign delivery with tracking
- Template management for reusable email patterns
- Subscription-based pricing with usage limits

---

## Core Features

### 1. User Authentication & Management

**Pages:** `/sign-in`, `/sign-up`, `/dashboard/profile`, `/dashboard/settings`

| Feature                | Description                                               |
|------------------------|-----------------------------------------------------------|
| Email/Password Sign-up | Create account with email, password, and full name        |
| Email/Password Sign-in | Authenticate with existing credentials                    |
| Google OAuth           | Sign in with Google account                               |
| GitHub OAuth           | Sign in with GitHub account                               |
| Profile Management     | Update name, company, industry, phone, website            |
| Account Deletion       | Permanently delete account and all associated data        |
| Session Management     | Cookie-based JWT sessions with automatic refresh          |

**Key Files:**
- `app/(auth)/sign-in/page.tsx` — Sign-in form with OAuth buttons
- `app/(auth)/sign-up/page.tsx` — Sign-up form with OAuth buttons
- `app/auth/callback/route.ts` — OAuth callback handler
- `app/(dashboard)/dashboard/profile/page.tsx` — Profile editor
- `middleware.ts` — Route protection (redirects unauthenticated to /sign-in)

---

### 2. Lead Upload & Management

**Page:** `/dashboard/upload`

| Feature                | Description                                               |
|------------------------|-----------------------------------------------------------|
| CSV File Upload        | Drag-and-drop or click-to-upload CSV files                |
| Auto Column Detection  | Maps CSV columns to lead fields (name, email, company...) |
| Data Preview           | Table preview of parsed CSV data before campaign creation  |
| Field Mapping          | Automatic mapping of common column name variants           |
| Custom Fields          | Extra CSV columns stored as JSONB custom_fields            |
| Validation             | Email format validation, required field checks             |

**Supported CSV Columns:**
- `name` / `Name` / `full_name` → lead name
- `email` / `Email` → lead email (required)
- `company` / `Company` → lead company
- `industry` / `Industry` → lead industry
- `title` / `Title` → job title
- `phone` / `Phone` → phone number
- `linkedin` / `LinkedIn` → LinkedIn URL
- Any additional columns → `custom_fields` JSONB

**Key Files:**
- `app/(dashboard)/dashboard/upload/page.tsx` — Upload UI with Papa Parse CSV parsing
- `app/api/campaigns/route.ts` (POST) — Creates campaign + bulk inserts leads

---

### 3. Campaign Management

**Pages:** `/dashboard/campaigns`, `/dashboard/campaigns/[id]`

| Feature                | Description                                               |
|------------------------|-----------------------------------------------------------|
| Campaign List          | View all campaigns with status, lead count, date          |
| Campaign Creation      | Create campaign from uploaded leads with email config      |
| Campaign Details       | View individual campaign with all leads and email logs     |
| Campaign Status        | Draft → Active → Completed / Paused tracking              |
| Email Configuration    | Set from email, from name, reply-to, subject, body        |
| Campaign Processing    | Trigger AI personalization + email sending                 |
| Campaign Deletion      | Delete campaign and all associated leads/logs              |

**Campaign Statuses:**
- `draft` — Created but not sent
- `active` — Currently sending emails
- `completed` — All emails sent
- `paused` — Temporarily stopped

**Key Files:**
- `app/(dashboard)/dashboard/campaigns/page.tsx` — Campaign list
- `app/api/campaigns/route.ts` — GET (list) / POST (create)
- `app/api/campaigns/[id]/route.ts` — GET (detail) / PUT (update) / DELETE
- `app/api/campaigns/[id]/emails/route.ts` — GET email logs for campaign
- `app/api/process-campaign/route.ts` — POST to trigger sending

---

### 4. AI-Powered Email Personalization

**Service:** `lib/ai-service.ts`

| Feature                | Description                                               |
|------------------------|-----------------------------------------------------------|
| Multi-Channel Content  | Generate content for email, LinkedIn, and Twitter          |
| Lead Data Extraction   | Dynamically extracts all available lead fields             |
| Confidence Scoring     | Rates content quality based on available lead data         |
| Human-like Tone        | Prompts designed for natural, non-AI-sounding copy         |
| JSON Structured Output | Returns subject, body, tone, and CTA as structured data   |
| Fallback Templates     | Pre-written templates if AI generation fails               |
| Batch Processing       | Process multiple leads in sequence                         |

**AI Configuration:**
- Provider: OpenRouter (OpenAI-compatible API)
- Default Model: `google/gemini-2.0-flash-001`
- Temperature: 0.7
- Max Tokens: 500 per lead
- System Prompt: "Expert cold email copywriter"

**Channel-Specific Prompts:**
- **Email**: 60-80 words, friendly colleague tone, specific company/industry references
- **LinkedIn**: Under 60 words, casual connection request style
- **Twitter**: Under 40 words, texting-casual DM style

**Key Files:**
- `lib/ai-service.ts` — AIService class with lazy initialization
- `app/api/sample-email/route.ts` — Preview single AI-generated email
- `app/api/process-campaign/route.ts` — Bulk AI generation for campaigns

---

### 5. Email Delivery & Tracking

**Service:** `lib/email-service.ts`

| Feature                | Description                                               |
|------------------------|-----------------------------------------------------------|
| Email Sending          | Send via Resend API with HTML formatting                   |
| Custom Sender          | Use custom from_email and from_name per campaign           |
| Reply-To Support       | Configure reply-to address                                 |
| Delivery Tracking      | Log sent/bounced status per email                          |
| Rate Limiting          | Respect Resend API rate limits                             |
| CAN-SPAM Compliance    | Unsubscribe links and physical address                     |

**Email Log Statuses:**
- `sent` — Successfully delivered to Resend
- `bounced` — Delivery failed
- `opened` — Recipient opened (if tracking enabled)
- `clicked` — Recipient clicked a link

**Key Files:**
- `lib/email-service.ts` — Resend email delivery
- `app/api/process-campaign/route.ts` — Orchestrates send flow
- `app/api/campaigns/[id]/emails/route.ts` — View email logs

---

### 6. Email Template Management

**Pages:** `/dashboard/templates`

| Feature                | Description                                               |
|------------------------|-----------------------------------------------------------|
| Template Gallery       | Browse system and user-created templates                   |
| Template Editor        | Rich text editor for creating/editing templates            |
| Mood Tags              | Tag templates by tone (professional, friendly, urgent...)  |
| Scenario Types         | Categorize by use case (intro, follow-up, pitch...)        |
| Variable System        | `{{variable}}` placeholders with auto-extraction           |
| Template Cart          | Save/favorite templates for quick access                   |
| Template Preview       | Live preview with variable substitution                    |
| Template Validation    | Content length limits, XSS prevention                      |

**Mood Tags:**
`professional` | `friendly` | `warm` | `formal` | `casual` | `persuasive` | `empathetic` | `urgent` | `celebratory` | `apologetic` | `helpful`

**Scenario Types:**
`Professional Introduction` | `Friendly Follow-up` | `Sales Pitch` | `Event Invitation` | `Apology Message` | `Urgent Notification` | `Thank You Note` | `Newsletter Update` | `Customer Support Response` | `Meeting Request` | `Custom`

**Key Files:**
- `app/(dashboard)/dashboard/templates/page.tsx` — Template gallery + editor
- `lib/types/template.ts` — Template types, mood configs, variable helpers
- `app/api/templates/route.ts` — GET (list) / POST (create)
- `app/api/templates/[id]/route.ts` — GET / PUT / DELETE
- `app/api/templates/cart/route.ts` — GET / POST cart
- `app/api/templates/cart/[id]/route.ts` — DELETE from cart

---

### 7. Email Preview & Example

**Page:** `/dashboard/email-example`

| Feature                | Description                                               |
|------------------------|-----------------------------------------------------------|
| Sample Email Preview   | Generate and view a sample personalized email              |
| AI Content Preview     | See what AI will generate before sending a campaign        |
| Template Rendering     | Preview templates with variable substitution               |

**Key Files:**
- `app/(dashboard)/dashboard/email-example/page.tsx` — Email preview page
- `app/api/sample-email/route.ts` — Generate sample email via AI

---

### 8. Custom Email Domains

**Page:** `/dashboard/domains`

| Feature                | Description                                               |
|------------------------|-----------------------------------------------------------|
| Add Domain             | Register a custom sending domain                           |
| DNS Records Display    | Show required DNS records (SPF, DKIM, MX)                 |
| Domain Verification    | Verify domain via DNS record checking                      |
| Set Default Domain     | Choose default sending domain                              |
| Delete Domain          | Remove a registered domain                                 |

**Domain Verification Statuses:**
- `pending` — DNS records not yet verified
- `verified` — Domain ready for sending
- `failed` — Verification failed

**Key Files:**
- `app/(dashboard)/dashboard/domains/page.tsx` — Domain management UI
- `lib/domain-service.ts` — Domain verification via Resend
- `app/api/user/domains/route.ts` — GET (list) / POST (add)
- `app/api/user/domains/[domainId]/route.ts` — GET / DELETE
- `app/api/user/domains/[domainId]/verify/route.ts` — POST verification
- `app/api/user/domains/[domainId]/set-default/route.ts` — POST set default

---

### 9. Subscription & Billing

**Page:** `/dashboard/pricing`

| Feature                | Description                                               |
|------------------------|-----------------------------------------------------------|
| Plan Comparison        | View Free / Pro / Enterprise features and pricing          |
| Stripe Checkout        | Redirect to Stripe for payment                             |
| Customer Portal        | Manage billing, invoices, cancel subscription              |
| Usage Tracking         | Track emails sent / campaigns created against plan limits  |
| Automatic Enforcement  | Block actions when plan limits are reached                  |

**Plans:**

| Plan         | Price    | Emails/mo | Campaigns | Leads/Upload | AI Requests/mo |
|--------------|----------|-----------|-----------|--------------|----------------|
| Free         | $0       | 50        | 3         | 100          | 150            |
| Pro          | $49/mo   | 1,000     | 20        | 500          | 3,000          |
| Enterprise   | $149/mo  | 5,000     | Unlimited | 1,000        | 10,000         |

**Key Files:**
- `app/(dashboard)/dashboard/pricing/page.tsx` — Pricing page
- `lib/stripe-service.ts` — Stripe checkout, portal, subscriptions
- `app/api/stripe/create-checkout-session/route.ts` — Create checkout
- `app/api/stripe/create-portal-session/route.ts` — Create portal
- `app/api/stripe/webhook/route.ts` — Handle Stripe events

---

### 10. Dashboard Analytics

**Page:** `/dashboard`

| Feature                | Description                                               |
|------------------------|-----------------------------------------------------------|
| Stats Overview         | Cards showing key metrics with change indicators           |
| Usage Progress         | Progress bars showing usage against plan limits            |
| Quick Actions          | Buttons for common tasks (upload, create campaign)         |

**Metrics Displayed:**
- Total campaigns (with trend)
- Total leads (with trend)
- Emails sent this month (against limit)
- Response rate (if tracked)

**Key Files:**
- `app/(dashboard)/dashboard/page.tsx` — Main dashboard
- `components/dashboard/stats.tsx` — Stats cards component
- `app/api/dashboard/usage/route.ts` — Usage data endpoint

---

## API Reference

### Authentication Required (All Dashboard APIs)

All `/api/*` endpoints (except auth-related) require a valid Supabase session cookie.

### Endpoints Summary

| Method   | Endpoint                                    | Purpose                          |
|----------|---------------------------------------------|----------------------------------|
| GET/PUT  | `/api/user/profile`                         | Get/update user profile          |
| GET/PUT  | `/api/user/settings`                        | Get/update user settings         |
| DELETE   | `/api/user/delete`                          | Delete user account              |
| GET/POST | `/api/campaigns`                            | List/create campaigns            |
| GET/PUT/DELETE | `/api/campaigns/[id]`                  | Campaign CRUD                    |
| GET      | `/api/campaigns/[id]/emails`                | Campaign email logs              |
| POST     | `/api/process-campaign`                     | Trigger campaign send            |
| GET/POST | `/api/templates`                            | List/create templates            |
| GET/PUT/DELETE | `/api/templates/[id]`                  | Template CRUD                    |
| GET/POST | `/api/templates/cart`                       | List/add cart items              |
| DELETE   | `/api/templates/cart/[id]`                  | Remove from cart                 |
| POST     | `/api/sample-email`                         | Generate sample email            |
| GET      | `/api/dashboard/usage`                      | Dashboard analytics              |
| GET/POST | `/api/user/domains`                         | List/add domains                 |
| GET/DELETE | `/api/user/domains/[domainId]`            | Domain CRUD                      |
| POST     | `/api/user/domains/[domainId]/verify`       | Verify domain                    |
| POST     | `/api/user/domains/[domainId]/set-default`  | Set default domain               |
| POST     | `/api/stripe/create-checkout-session`       | Stripe checkout                  |
| POST     | `/api/stripe/create-portal-session`         | Stripe portal                    |
| POST     | `/api/stripe/webhook`                       | Stripe webhook handler           |

---

## Component Architecture

### Dashboard Layout Components

```
app/(dashboard)/layout.tsx
├── Sidebar Navigation
│   ├── Dashboard (home)
│   ├── Campaigns
│   ├── Upload
│   ├── Templates
│   ├── Email Preview
│   ├── Domains
│   ├── Profile
│   ├── Settings
│   └── Pricing
│
├── components/dashboard/header.tsx
│   ├── Page title
│   ├── Search bar
│   ├── Notifications
│   └── User avatar + dropdown (sign out)
│
└── Main Content Area
    └── {children} (page content)
```

### UI Component Library (shadcn/ui)

```
components/ui/
├── button.tsx          # Primary/secondary/ghost/destructive variants
├── card.tsx            # Content cards with header/content/footer
├── dialog.tsx          # Modal dialogs
├── dropdown-menu.tsx   # Dropdown menus
├── form.tsx            # Form primitives (react-hook-form integration)
├── input.tsx           # Text inputs
├── label.tsx           # Form labels
├── select.tsx          # Select dropdowns
├── separator.tsx       # Visual separators
├── sheet.tsx           # Side panel overlays
├── skeleton.tsx        # Loading placeholders
├── sonner.tsx          # Toast notifications (via sonner)
├── table.tsx           # Data tables
├── tabs.tsx            # Tab navigation
├── textarea.tsx        # Multi-line text input
├── toast.tsx           # Toast notification system
├── toaster.tsx         # Toast container
└── calendar.tsx        # Date picker calendar
```
