# LeadGen AI — Data Flow Diagrams

## Table of Contents
1. [Authentication Flow](#1-authentication-flow)
2. [Lead Upload Flow](#2-lead-upload-flow)
3. [Campaign Creation Flow](#3-campaign-creation-flow)
4. [Campaign Processing / Email Sending Flow](#4-campaign-processing--email-sending-flow)
5. [AI Content Generation Flow](#5-ai-content-generation-flow)
6. [Template Management Flow](#6-template-management-flow)
7. [Dashboard Analytics Flow](#7-dashboard-analytics-flow)
8. [Subscription / Payment Flow](#8-subscription--payment-flow)
9. [Custom Domain Flow](#9-custom-domain-flow)
10. [User Profile Management Flow](#10-user-profile-management-flow)

---

## 1. Authentication Flow

### Sign Up (Email + Password)

```
User                    Browser                Sign-Up Page           Supabase Auth         Database
 │                        │                       │                      │                    │
 │  Fill form             │                       │                      │                    │
 │──────────────────────▶│                       │                      │                    │
 │                        │  Submit email/pass    │                      │                    │
 │                        │──────────────────────▶│                      │                    │
 │                        │                       │  signUp({email,pass})│                    │
 │                        │                       │─────────────────────▶│                    │
 │                        │                       │                      │  Create auth user  │
 │                        │                       │                      │  Set JWT cookies   │
 │                        │                       │◀─────────────────────│                    │
 │                        │                       │                      │                    │
 │                        │                       │  POST /api/user/profile (create user row) │
 │                        │                       │──────────────────────────────────────────▶│
 │                        │                       │                      │   INSERT into users│
 │                        │                       │◀─────────────────────────────────────────│
 │                        │  Redirect /dashboard  │                      │                    │
 │                        │◀──────────────────────│                      │                    │
 │  Dashboard loads       │                       │                      │                    │
 │◀────────────────────── │                       │                      │                    │
```

### Sign In (Email + Password)

```
User              Sign-In Page            Supabase Auth          Middleware           Dashboard
 │                    │                       │                     │                    │
 │  Enter creds       │                       │                     │                    │
 │───────────────────▶│                       │                     │                    │
 │                    │  signInWithPassword()  │                     │                    │
 │                    │──────────────────────▶│                     │                    │
 │                    │                       │  Validate creds     │                    │
 │                    │                       │  Set JWT cookies    │                    │
 │                    │◀──────────────────────│                     │                    │
 │                    │  router.push(/dash)   │                     │                    │
 │                    │─────────────────────────────────────────────▶│                    │
 │                    │                       │  getUser() ✓        │                    │
 │                    │                       │◀─────────────────── │                    │
 │                    │                       │                     │  Allow access       │
 │                    │                       │                     │───────────────────▶│
 │  Dashboard         │                       │                     │                    │
 │◀──────────────────────────────────────────────────────────────────────────────────── │
```

### OAuth (Google / GitHub)

```
User          Sign-In Page        Supabase Auth       OAuth Provider     Callback Route
 │                │                    │                    │                 │
 │  Click OAuth   │                    │                    │                 │
 │───────────────▶│                    │                    │                 │
 │                │ signInWithOAuth()  │                    │                 │
 │                │───────────────────▶│                    │                 │
 │                │                    │  Redirect to       │                 │
 │◀───────────────────────────────────────────────────────▶│                 │
 │  Authorize     │                    │                    │                 │
 │───────────────────────────────────────────────────────▶│                 │
 │                │                    │  Auth code         │                 │
 │                │                    │◀───────────────────│                 │
 │                │                    │                    │                 │
 │  Redirect to /auth/callback?code=  │                    │                 │
 │───────────────────────────────────────────────────────────────────────── ▶│
 │                │                    │  Exchange code     │                 │
 │                │                    │◀────────────────────────────────────│
 │                │                    │  Set session       │                 │
 │                │                    │────────────────────────────────────▶│
 │                │                    │                    │  Redirect /dash │
 │◀──────────────────────────────────────────────────────────────────────── │
```

---

## 2. Lead Upload Flow

```
User              Upload Page           Papa Parse          API /campaigns        Database
 │                    │                    │                     │                   │
 │  Select CSV file   │                    │                     │                   │
 │───────────────────▶│                    │                     │                   │
 │                    │  Parse CSV         │                     │                   │
 │                    │───────────────────▶│                     │                   │
 │                    │                    │  Return parsed rows │                   │
 │                    │◀───────────────────│                     │                   │
 │                    │                                          │                   │
 │  Preview data      │  Show parsed leads in table             │                   │
 │◀───────────────────│                                          │                   │
 │                    │                                          │                   │
 │  Click "Create     │                                          │                   │
 │  Campaign"         │                                          │                   │
 │───────────────────▶│                                          │                   │
 │                    │  POST /api/campaigns                     │                   │
 │                    │  { name, leads[], subject, body,         │                   │
 │                    │    from_email, from_name, reply_to }     │                   │
 │                    │─────────────────────────────────────────▶│                   │
 │                    │                                          │                   │
 │                    │                    Auth check: getUser() │                   │
 │                    │                    Ensure user exists     │                   │
 │                    │                                          │                   │
 │                    │                                          │  INSERT campaign  │
 │                    │                                          │─────────────────▶│
 │                    │                                          │                   │
 │                    │                                          │  INSERT leads     │
 │                    │                                          │  (bulk, per CSV   │
 │                    │                                          │   row)            │
 │                    │                                          │─────────────────▶│
 │                    │                                          │                   │
 │                    │  Response: { campaign, leads }           │                   │
 │                    │◀─────────────────────────────────────────│                   │
 │  Success toast     │                                          │                   │
 │◀───────────────────│                                          │                   │
```

### CSV Column Mapping

```
CSV File Columns              Lead Record Fields
─────────────────             ──────────────────
name / Name / full_name  ───▶ name
email / Email            ───▶ email
company / Company        ───▶ company
industry / Industry      ───▶ industry
title / Title            ───▶ title
phone / Phone            ───▶ phone
linkedin / LinkedIn      ───▶ linkedin_url
(any other column)       ───▶ custom_fields (JSONB)
```

---

## 3. Campaign Creation Flow

```
┌───────────────────────────────────────────────────────────────────┐
│                    Campaign Creation Pipeline                      │
│                                                                    │
│  ┌──────────┐    ┌───────────┐    ┌───────────┐    ┌──────────┐  │
│  │ Upload   │───▶│ Configure │───▶│ Preview   │───▶│ Create   │  │
│  │ CSV      │    │ Campaign  │    │ Content   │    │ Campaign │  │
│  │          │    │ Details   │    │           │    │          │  │
│  └──────────┘    └───────────┘    └───────────┘    └──────────┘  │
│       │               │                │                │         │
│  Parse CSV      Set name,         AI generates      POST to      │
│  Map columns    subject,          sample email      /api/campaigns│
│  Preview data   body template,    for preview       Store in DB   │
│                 from email,                                       │
│                 reply-to                                          │
└───────────────────────────────────────────────────────────────────┘
```

### Data Created

```
POST /api/campaigns
├── Creates: 1 campaign record (status: 'draft')
├── Creates: N lead records (status: 'pending')
├── Links: leads → campaign via campaign_id FK
└── Returns: campaign object + lead count
```

---

## 4. Campaign Processing / Email Sending Flow

```
User          Campaigns Page      POST /api/process-campaign     AI Service        Email Service      Database
 │                │                        │                        │                  │                │
 │  Click "Send"  │                        │                        │                  │                │
 │───────────────▶│                        │                        │                  │                │
 │                │  POST { campaignId }   │                        │                  │                │
 │                │───────────────────────▶│                        │                  │                │
 │                │                        │                        │                  │                │
 │                │                        │  1. Auth check         │                  │                │
 │                │                        │  2. Fetch campaign     │                  │                │
 │                │                        │  3. Fetch leads        │                  │                │
 │                │                        │◀─────────────────────────────────────────────────────────▶│
 │                │                        │                        │                  │                │
 │                │                        │  4. Send to AI         │                  │                │
 │                │                        │───────────────────────▶│                  │                │
 │                │                        │                        │                  │                │
 │                │                        │                        │  For each lead:  │                │
 │                │                        │                        │  Generate email  │                │
 │                │                        │                        │  subject + body  │                │
 │                │                        │◀───────────────────────│                  │                │
 │                │                        │                        │                  │                │
 │                │                        │  5. For each lead with AI content:       │                │
 │                │                        │─────────────────────────────────────────▶│                │
 │                │                        │                        │  Send email via  │                │
 │                │                        │                        │  Resend API      │                │
 │                │                        │                        │  (from_email,    │                │
 │                │                        │                        │   to, subject,   │                │
 │                │                        │                        │   html body)     │                │
 │                │                        │◀─────────────────────────────────────────│                │
 │                │                        │                        │                  │                │
 │                │                        │  6. Log results        │                  │                │
 │                │                        │─────────────────────────────────────────────────────────▶│
 │                │                        │     INSERT email_logs (sent/bounced)      │                │
 │                │                        │     UPDATE lead status (contacted)        │                │
 │                │                        │     UPDATE campaign (sent count, status)  │                │
 │                │                        │                        │                  │                │
 │                │  Response: results     │                        │                  │                │
 │                │◀───────────────────────│                        │                  │                │
 │  Success/fail  │                        │                        │                  │                │
 │◀───────────────│                        │                        │                  │                │
```

### Email Processing Pipeline (per lead)

```
Lead Data ──▶ AI Personalization ──▶ Email Construction ──▶ Resend API ──▶ Log Result
                    │                       │                    │              │
            Generate subject         Build HTML email       Send via API   email_logs
            Generate body            Apply template         Rate limit     lead.status
            Score confidence         Add unsubscribe        Track errors   campaign stats
```

---

## 5. AI Content Generation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Service Pipeline                        │
│                                                               │
│  Input: Lead[]     ┌──────────────────────────────────────┐  │
│  + Channels[]      │  For each lead:                      │  │
│                    │                                      │  │
│                    │  1. Extract available fields          │  │
│                    │     (name, email, company, industry,  │  │
│                    │      + any custom fields)             │  │
│                    │                                      │  │
│                    │  2. Calculate confidence score        │  │
│                    │     Base: 50                         │  │
│                    │     +15 per required field (name,    │  │
│                    │         email)                       │  │
│                    │     +10 per desired field (company,  │  │
│                    │         industry)                    │  │
│                    │     +2 per extra field (max +10)     │  │
│                    │     Cap: 95                          │  │
│                    │                                      │  │
│                    │  3. For each channel (email/linkedin/ │  │
│                    │     twitter):                        │  │
│                    │     ┌──────────────────────────────┐ │  │
│                    │     │ Build channel-specific prompt │ │  │
│                    │     │ ─── Include lead data        │ │  │
│                    │     │ ─── Include tone guidelines   │ │  │
│                    │     │ ─── Request JSON response     │ │  │
│                    │     └─────────────┬────────────────┘ │  │
│                    │                   │                   │  │
│                    │                   ▼                   │  │
│                    │     ┌──────────────────────────────┐ │  │
│                    │     │ OpenRouter API Call           │ │  │
│                    │     │ Model: gemini-2.0-flash-001  │ │  │
│                    │     │ Temp: 0.7                    │ │  │
│                    │     │ Max tokens: 500              │ │  │
│                    │     └─────────────┬────────────────┘ │  │
│                    │                   │                   │  │
│                    │                   ▼                   │  │
│                    │     ┌──────────────────────────────┐ │  │
│                    │     │ Parse JSON Response          │ │  │
│                    │     │ Extract: subject, body,      │ │  │
│                    │     │   tone, callToAction         │ │  │
│                    │     │ Fallback if parse fails      │ │  │
│                    │     └──────────────────────────────┘ │  │
│                    │                                      │  │
│                    └──────────────────────────────────────┘  │
│                                                               │
│  Output: ProcessedLead[] with channelContent per lead         │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Template Management Flow

### Template CRUD

```
User             Templates Page         API /templates           Database
 │                    │                      │                      │
 │  Browse templates  │                      │                      │
 │───────────────────▶│                      │                      │
 │                    │  GET /api/templates   │                      │
 │                    │  ?mood=X&scenario=Y   │                      │
 │                    │─────────────────────▶│                      │
 │                    │                      │  SELECT from         │
 │                    │                      │  email_templates     │
 │                    │                      │  WHERE filters       │
 │                    │                      │─────────────────────▶│
 │                    │  Templates[]         │                      │
 │                    │◀─────────────────────│                      │
 │  Display gallery   │                      │                      │
 │◀───────────────────│                      │                      │
 │                    │                      │                      │
 │  Create template   │                      │                      │
 │───────────────────▶│                      │                      │
 │                    │  POST /api/templates  │                      │
 │                    │  { name, content,     │                      │
 │                    │    mood_tags,          │                      │
 │                    │    scenario,           │                      │
 │                    │    variables }         │                      │
 │                    │─────────────────────▶│                      │
 │                    │                      │  INSERT template     │
 │                    │                      │  (created_by = user) │
 │                    │                      │─────────────────────▶│
 │                    │  Created template    │                      │
 │                    │◀─────────────────────│                      │
 │  Success toast     │                      │                      │
 │◀───────────────────│                      │                      │
```

### Template Cart (Save/Favorite)

```
User             Templates Page         API /templates/cart      Database
 │                    │                      │                     │
 │  Click "Save"      │                      │                     │
 │───────────────────▶│                      │                     │
 │                    │ POST /api/templates/  │                     │
 │                    │ cart { template_id }  │                     │
 │                    │─────────────────────▶│                     │
 │                    │                      │  INSERT into        │
 │                    │                      │  user_template_cart │
 │                    │                      │─────────────────────▶│
 │                    │  Added to cart       │                     │
 │                    │◀─────────────────────│                     │
 │  "Saved!" toast    │                      │                     │
 │◀───────────────────│                      │                     │
```

### Template Variable System

```
Template Content                    Variable Extraction           Rendered Output
─────────────────                   ────────────────────          ──────────────────
"Hi {{name}},                       extractVariables():           "Hi John,
 I noticed {{company}}              → ['name', 'company',         I noticed Acme Corp
 is doing great in                    'industry']                  is doing great in
 {{industry}}..."                                                  SaaS..."
                                    replaceVariables(template,
                                      { name: 'John',
                                        company: 'Acme Corp',
                                        industry: 'SaaS' })
```

---

## 7. Dashboard Analytics Flow

```
User              Dashboard Page       GET /api/dashboard/usage    Database
 │                    │                        │                      │
 │  Open dashboard    │                        │                      │
 │───────────────────▶│                        │                      │
 │                    │  GET /api/dashboard/   │                      │
 │                    │  usage                 │                      │
 │                    │───────────────────────▶│                      │
 │                    │                        │                      │
 │                    │                        │  1. Get user profile │
 │                    │                        │─────────────────────▶│
 │                    │                        │  (plan_type, limits) │
 │                    │                        │◀─────────────────────│
 │                    │                        │                      │
 │                    │                        │  2. Count campaigns  │
 │                    │                        │─────────────────────▶│
 │                    │                        │  SELECT count(*)     │
 │                    │                        │  FROM campaigns      │
 │                    │                        │◀─────────────────────│
 │                    │                        │                      │
 │                    │                        │  3. Count leads      │
 │                    │                        │─────────────────────▶│
 │                    │                        │  SELECT count(*)     │
 │                    │                        │  FROM leads          │
 │                    │                        │◀─────────────────────│
 │                    │                        │                      │
 │                    │                        │  4. Count emails     │
 │                    │                        │─────────────────────▶│
 │                    │                        │  SELECT count(*)     │
 │                    │                        │  FROM email_logs     │
 │                    │                        │  WHERE this month    │
 │                    │                        │◀─────────────────────│
 │                    │                        │                      │
 │                    │  Response:             │                      │
 │                    │  { campaigns, leads,   │                      │
 │                    │    emails_sent,        │                      │
 │                    │    emails_limit,       │                      │
 │                    │    plan_type }         │                      │
 │                    │◀───────────────────────│                      │
 │                    │                        │                      │
 │  Render stats      │                        │                      │
 │  cards + charts    │                        │                      │
 │◀───────────────────│                        │                      │
```

### Dashboard Stats Cards

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Total Campaigns │  │  Total Leads    │  │  Emails Sent    │  │  Response Rate  │
│                 │  │                 │  │  (this month)   │  │                 │
│    ██  12       │  │    ██  1,234    │  │    ██  45/50    │  │    ██  23%      │
│    ▲ +3         │  │    ▲ +156       │  │    ▲ +12        │  │    ▲ +5%        │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## 8. Subscription / Payment Flow

### Checkout Flow

```
User           Pricing Page        POST /api/stripe/           Stripe          Database
 │                 │              create-checkout-session         │                │
 │  Select plan    │                      │                      │                │
 │────────────────▶│                      │                      │                │
 │                 │  POST { priceId }    │                      │                │
 │                 │─────────────────────▶│                      │                │
 │                 │                      │                      │                │
 │                 │                      │  1. Get/create       │                │
 │                 │                      │     Stripe customer  │                │
 │                 │                      │─────────────────────▶│                │
 │                 │                      │◀─────────────────────│                │
 │                 │                      │                      │                │
 │                 │                      │  2. Create checkout  │                │
 │                 │                      │     session          │                │
 │                 │                      │─────────────────────▶│                │
 │                 │                      │  Session URL         │                │
 │                 │                      │◀─────────────────────│                │
 │                 │                      │                      │                │
 │                 │                      │  3. Save customer_id │                │
 │                 │                      │─────────────────────────────────────▶│
 │                 │  { url }             │                      │                │
 │                 │◀─────────────────────│                      │                │
 │                 │                      │                      │                │
 │  Redirect to    │                      │                      │                │
 │  Stripe         │                      │                      │                │
 │  Checkout       │                      │                      │                │
 │─────────────────────────────────────────────────────────────▶│                │
 │                 │                      │                      │                │
 │  Complete       │                      │                      │                │
 │  payment        │                      │                      │                │
 │─────────────────────────────────────────────────────────────▶│                │
 │                 │                      │                      │                │
 │                 │         Webhook: checkout.session.completed │                │
 │                 │                      │◀─────────────────────│                │
 │                 │                      │  Update user plan    │                │
 │                 │                      │─────────────────────────────────────▶│
 │                 │                      │  UPDATE users        │                │
 │                 │                      │  SET plan_type,      │                │
 │                 │                      │  stripe_subscription │                │
 │                 │                      │                      │                │
 │  Redirect back  │                      │                      │                │
 │◀────────────────────────────────────────────────────────────│                │
```

### Plan Limits Enforcement

```
┌─────────────────────────────────────────────────────────────┐
│                    Usage Check Pipeline                       │
│                                                               │
│  Request arrives ──▶ Get user plan ──▶ Get current usage     │
│                          │                    │               │
│                          ▼                    ▼               │
│                    ┌──────────┐        ┌──────────┐          │
│                    │ Free     │        │ Count    │          │
│                    │  50 email│        │ emails   │          │
│                    │  3 camps │        │ this     │          │
│                    │ Pro      │        │ month    │          │
│                    │ 1000 em  │        │          │          │
│                    │ 20 camps │        │ Count    │          │
│                    │ Enterprise        │ campaigns│          │
│                    │ 5000 em  │        │          │          │
│                    │ Unlimited│        └─────┬────┘          │
│                    └─────┬────┘              │               │
│                          │                   │               │
│                          ▼                   ▼               │
│                    ┌─────────────────────────────┐           │
│                    │ usage < limit ? ALLOW : DENY│           │
│                    └─────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Custom Domain Flow

### Add & Verify Domain

```
User           Domains Page       POST /api/user/domains       Resend API       Database
 │                 │                      │                       │                │
 │  Enter domain   │                      │                       │                │
 │────────────────▶│                      │                       │                │
 │                 │  POST { domain }     │                       │                │
 │                 │─────────────────────▶│                       │                │
 │                 │                      │  Create domain        │                │
 │                 │                      │─────────────────────▶│                │
 │                 │                      │  DNS records to add   │                │
 │                 │                      │◀─────────────────────│                │
 │                 │                      │                       │                │
 │                 │                      │  Save domain record   │                │
 │                 │                      │──────────────────────────────────────▶│
 │                 │  DNS records         │                       │                │
 │                 │◀─────────────────────│                       │                │
 │  Add DNS records│                      │                       │                │
 │  to registrar   │                      │                       │                │
 │                 │                      │                       │                │
 │  Click "Verify" │                      │                       │                │
 │────────────────▶│                      │                       │                │
 │                 │ POST /domains/       │                       │                │
 │                 │ {id}/verify          │                       │                │
 │                 │─────────────────────▶│                       │                │
 │                 │                      │  Check verification   │                │
 │                 │                      │─────────────────────▶│                │
 │                 │                      │  Status: verified ✓   │                │
 │                 │                      │◀─────────────────────│                │
 │                 │                      │  Update status        │                │
 │                 │                      │──────────────────────────────────────▶│
 │                 │  "Verified!"         │                       │                │
 │                 │◀─────────────────────│                       │                │
 │  Domain ready   │                      │                       │                │
 │◀────────────────│                      │                       │                │
```

---

## 10. User Profile Management Flow

```
User           Profile Page        GET/PUT /api/user/profile     Database
 │                 │                        │                       │
 │  Open profile   │                        │                       │
 │────────────────▶│                        │                       │
 │                 │  GET /api/user/profile │                       │
 │                 │───────────────────────▶│                       │
 │                 │                        │  SELECT from users    │
 │                 │                        │  WHERE auth_user_id   │
 │                 │                        │─────────────────────▶│
 │                 │  { user data }         │                       │
 │                 │◀───────────────────────│                       │
 │  Display form   │                        │                       │
 │◀────────────────│                        │                       │
 │                 │                        │                       │
 │  Edit & save    │                        │                       │
 │────────────────▶│                        │                       │
 │                 │  PUT /api/user/profile │                       │
 │                 │  { full_name, company, │                       │
 │                 │    industry, ... }     │                       │
 │                 │───────────────────────▶│                       │
 │                 │                        │  UPDATE users         │
 │                 │                        │  SET fields           │
 │                 │                        │─────────────────────▶│
 │                 │  { updated user }      │                       │
 │                 │◀───────────────────────│                       │
 │  "Saved!" toast │                        │                       │
 │◀────────────────│                        │                       │
```

### Account Deletion Flow

```
User           Settings Page       DELETE /api/user/delete      Database        Supabase Auth
 │                 │                        │                      │                 │
 │  Click delete   │                        │                      │                 │
 │────────────────▶│                        │                      │                 │
 │                 │  Confirm dialog        │                      │                 │
 │  Confirm        │                        │                      │                 │
 │────────────────▶│                        │                      │                 │
 │                 │  DELETE /api/user/     │                      │                 │
 │                 │  delete               │                      │                 │
 │                 │───────────────────────▶│                      │                 │
 │                 │                        │  DELETE FROM users   │                 │
 │                 │                        │  (cascades to all    │                 │
 │                 │                        │   related records)   │                 │
 │                 │                        │─────────────────────▶│                 │
 │                 │                        │                      │                 │
 │                 │                        │  Delete auth user    │                 │
 │                 │                        │─────────────────────────────────────▶│
 │                 │                        │                      │                 │
 │                 │  Success              │                      │                 │
 │                 │◀───────────────────────│                      │                 │
 │  Redirect to /  │                        │                      │                 │
 │◀────────────────│                        │                      │                 │
```
