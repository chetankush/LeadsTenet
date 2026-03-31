# LeadGen AI — Database Schema Documentation

## Table of Contents
1. [Schema Overview](#schema-overview)
2. [Table Definitions](#table-definitions)
3. [Relationships & Foreign Keys](#relationships--foreign-keys)
4. [Row Level Security (RLS)](#row-level-security-rls)
5. [Database Functions](#database-functions)
6. [Indexes](#indexes)
7. [Migration History](#migration-history)

---

## Schema Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        LeadGen AI Database Schema                        │
│                                                                          │
│  ┌─────────┐     ┌───────────┐     ┌─────────┐     ┌──────────────┐    │
│  │  users   │────▶│ campaigns │────▶│  leads  │     │ email_logs   │    │
│  │         │     │           │     │         │◀────│              │    │
│  └────┬────┘     └─────┬─────┘     └─────────┘     └──────────────┘    │
│       │                │                                                 │
│       │          ┌─────┴──────────┐                                     │
│       │          │ campaign_      │                                      │
│       │          │ templates      │                                      │
│       │          └─────┬──────────┘                                     │
│       │                │                                                 │
│  ┌────┴────────┐ ┌─────┴──────────┐                                    │
│  │ user_       │ │ email_         │                                      │
│  │ template_   │ │ templates      │                                      │
│  │ cart        │ │                │                                      │
│  └─────────────┘ └────────────────┘                                     │
│                                                                          │
│  ┌──────────────────┐                                                    │
│  │ custom_email_    │                                                    │
│  │ domains          │                                                    │
│  └──────────────────┘                                                    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Table Definitions

### 1. `users`

The primary user profile table, linked to Supabase Auth via `auth_user_id`.

| Column                    | Type          | Nullable | Default              | Description                         |
|---------------------------|---------------|----------|----------------------|-------------------------------------|
| `id`                      | uuid          | NO       | gen_random_uuid()    | Primary key                         |
| `auth_user_id`            | text          | YES      |                      | Supabase Auth user ID (unique)      |
| `email`                   | text          | NO       |                      | User email address                  |
| `full_name`               | text          | YES      |                      | Display name                        |
| `company_name`            | text          | YES      |                      | Company name                        |
| `industry`                | text          | YES      |                      | Industry sector                     |
| `phone`                   | text          | YES      |                      | Phone number                        |
| `website`                 | text          | YES      |                      | Website URL                         |
| `avatar_url`              | text          | YES      |                      | Profile picture URL                 |
| `plan_type`               | text          | YES      | 'free'               | Subscription plan (free/pro/enterprise) |
| `stripe_customer_id`      | text          | YES      |                      | Stripe customer ID                  |
| `stripe_subscription_id`  | text          | YES      |                      | Stripe subscription ID              |
| `stripe_price_id`         | text          | YES      |                      | Stripe price ID for current plan    |
| `subscription_status`     | text          | YES      |                      | Stripe subscription status          |
| `emails_sent_this_month`  | integer       | YES      | 0                    | Monthly email counter               |
| `monthly_email_limit`     | integer       | YES      | 50                   | Max emails per month (plan-based)   |
| `total_campaigns`         | integer       | YES      | 0                    | Total campaign count                |
| `total_leads`             | integer       | YES      | 0                    | Total lead count                    |
| `onboarding_completed`    | boolean       | YES      | false                | Onboarding status                   |
| `created_at`              | timestamptz   | YES      | now()                | Account creation date               |
| `updated_at`              | timestamptz   | YES      | now()                | Last update date                    |

**Constraints:**
- `users_pkey` — PRIMARY KEY (id)
- `users_auth_user_id_key` — UNIQUE (auth_user_id)
- `users_email_key` — UNIQUE (email)

---

### 2. `campaigns`

Email campaigns created by users.

| Column           | Type          | Nullable | Default           | Description                         |
|------------------|---------------|----------|-------------------|-------------------------------------|
| `id`             | uuid          | NO       | gen_random_uuid()  | Primary key                         |
| `user_id`        | uuid          | NO       |                    | FK → users.id                       |
| `name`           | text          | NO       |                    | Campaign name                       |
| `description`    | text          | YES      |                    | Campaign description                |
| `status`         | text          | YES      | 'draft'            | draft/active/completed/paused       |
| `subject`        | text          | YES      |                    | Email subject template              |
| `body`           | text          | YES      |                    | Email body template                 |
| `from_email`     | text          | YES      |                    | Sender email address                |
| `from_name`      | text          | YES      |                    | Sender display name                 |
| `reply_to_email` | text          | YES      |                    | Reply-to email address              |
| `total_leads`    | integer       | YES      | 0                  | Total leads in campaign             |
| `sent_count`     | integer       | YES      | 0                  | Emails successfully sent            |
| `failed_count`   | integer       | YES      | 0                  | Emails that failed                  |
| `open_count`     | integer       | YES      | 0                  | Emails opened                       |
| `click_count`    | integer       | YES      | 0                  | Links clicked                       |
| `reply_count`    | integer       | YES      | 0                  | Replies received                    |
| `scheduled_at`   | timestamptz   | YES      |                    | Scheduled send time                 |
| `completed_at`   | timestamptz   | YES      |                    | Campaign completion time            |
| `created_at`     | timestamptz   | YES      | now()              | Creation date                       |
| `updated_at`     | timestamptz   | YES      | now()              | Last update date                    |

**Constraints:**
- `campaigns_pkey` — PRIMARY KEY (id)
- `campaigns_user_id_fkey` — FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

---

### 3. `leads`

Individual contacts within campaigns.

| Column           | Type          | Nullable | Default           | Description                         |
|------------------|---------------|----------|-------------------|-------------------------------------|
| `id`             | uuid          | NO       | gen_random_uuid()  | Primary key                         |
| `campaign_id`    | uuid          | NO       |                    | FK → campaigns.id                   |
| `email`          | text          | NO       |                    | Lead email address                  |
| `name`           | text          | YES      |                    | Lead full name                      |
| `company`        | text          | YES      |                    | Lead company name                   |
| `industry`       | text          | YES      |                    | Lead industry                       |
| `title`          | text          | YES      |                    | Job title                           |
| `phone`          | text          | YES      |                    | Phone number                        |
| `linkedin_url`   | text          | YES      |                    | LinkedIn profile URL                |
| `status`         | text          | YES      | 'pending'          | pending/contacted/replied/bounced   |
| `custom_fields`  | jsonb         | YES      |                    | Extra CSV columns as JSON           |
| `created_at`     | timestamptz   | YES      | now()              | Creation date                       |
| `updated_at`     | timestamptz   | YES      | now()              | Last update date                    |

**Constraints:**
- `leads_pkey` — PRIMARY KEY (id)
- `leads_campaign_id_fkey` — FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE

---

### 4. `email_logs`

Record of every email sent through the platform.

| Column           | Type          | Nullable | Default           | Description                         |
|------------------|---------------|----------|-------------------|-------------------------------------|
| `id`             | uuid          | NO       | gen_random_uuid()  | Primary key                         |
| `campaign_id`    | uuid          | NO       |                    | FK → campaigns.id                   |
| `lead_id`        | uuid          | YES      |                    | FK → leads.id                       |
| `to_email`       | text          | NO       |                    | Recipient email                     |
| `from_email`     | text          | YES      |                    | Sender email                        |
| `subject`        | text          | YES      |                    | Email subject line                  |
| `body`           | text          | YES      |                    | Email body content                  |
| `status`         | text          | YES      | 'pending'          | sent/bounced/opened/clicked         |
| `resend_id`      | text          | YES      |                    | Resend API message ID               |
| `opened_at`      | timestamptz   | YES      |                    | When email was opened               |
| `clicked_at`     | timestamptz   | YES      |                    | When a link was clicked             |
| `bounced_at`     | timestamptz   | YES      |                    | When email bounced                  |
| `error_message`  | text          | YES      |                    | Error details if failed             |
| `created_at`     | timestamptz   | YES      | now()              | When email was sent                 |

**Constraints:**
- `email_logs_pkey` — PRIMARY KEY (id)
- `email_logs_campaign_id_fkey` — FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
- `email_logs_lead_id_fkey` — FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL

---

### 5. `email_templates`

Reusable email templates (system-provided and user-created).

| Column              | Type          | Nullable | Default           | Description                         |
|---------------------|---------------|----------|-------------------|-------------------------------------|
| `id`                | uuid          | NO       | gen_random_uuid()  | Primary key                         |
| `name`              | text          | NO       |                    | Template name                       |
| `description`       | text          | YES      |                    | Template description                |
| `content`           | text          | NO       |                    | Template body (with {{variables}})  |
| `subject_template`  | text          | YES      |                    | Subject line template               |
| `is_system`         | boolean       | YES      | false              | System template (not editable)      |
| `created_by`        | text          | YES      |                    | User auth_user_id (null for system) |
| `mood_tags`         | text[]        | YES      | '{}'               | Array of mood tags                  |
| `custom_tags`       | text[]        | YES      | '{}'               | Array of custom tags                |
| `scenario`          | text          | YES      | 'Custom'           | Template scenario/category          |
| `usage_count`       | integer       | YES      | 0                  | Times this template has been used   |
| `variables`         | jsonb         | YES      | '{}'               | Variable definitions as JSON        |
| `preview_text`      | text          | YES      |                    | Preview snippet                     |
| `thumbnail_url`     | text          | YES      |                    | Template thumbnail image            |
| `status`            | text          | YES      | 'active'           | active/draft/archived               |
| `created_at`        | timestamptz   | YES      | now()              | Creation date                       |
| `updated_at`        | timestamptz   | YES      | now()              | Last update date                    |

**Constraints:**
- `email_templates_pkey` — PRIMARY KEY (id)

---

### 6. `user_template_cart`

User's saved/favorited templates.

| Column           | Type          | Nullable | Default           | Description                         |
|------------------|---------------|----------|-------------------|-------------------------------------|
| `id`             | uuid          | NO       | gen_random_uuid()  | Primary key                         |
| `user_id`        | uuid          | NO       |                    | FK → users.id                       |
| `template_id`    | uuid          | NO       |                    | FK → email_templates.id             |
| `folder_name`    | text          | YES      |                    | Optional folder organization        |
| `is_favorite`    | boolean       | YES      | false              | Marked as favorite                  |
| `custom_notes`   | text          | YES      |                    | User notes about the template       |
| `added_at`       | timestamptz   | YES      | now()              | When saved to cart                  |

**Constraints:**
- `user_template_cart_pkey` — PRIMARY KEY (id)
- `user_template_cart_user_id_template_id_key` — UNIQUE (user_id, template_id)
- `user_template_cart_user_id_fkey` — FK → users(id) ON DELETE CASCADE
- `user_template_cart_template_id_fkey` — FK → email_templates(id) ON DELETE CASCADE

---

### 7. `campaign_templates`

Many-to-many join table linking campaigns to templates (for A/B testing).

| Column             | Type          | Nullable | Default           | Description                         |
|--------------------|---------------|----------|-------------------|-------------------------------------|
| `id`               | uuid          | NO       | gen_random_uuid()  | Primary key                         |
| `campaign_id`      | uuid          | NO       |                    | FK → campaigns.id                   |
| `template_id`      | uuid          | NO       |                    | FK → email_templates.id             |
| `assigned_at`      | timestamptz   | YES      | now()              | When template was assigned          |
| `assigned_by`      | text          | YES      |                    | User who assigned it                |
| `variant_name`     | text          | YES      |                    | A/B test variant name               |
| `split_percentage` | integer       | YES      | 100                | Traffic split percentage            |
| `is_active`        | boolean       | YES      | true               | Whether variant is active           |

**Constraints:**
- `campaign_templates_pkey` — PRIMARY KEY (id)
- `campaign_templates_campaign_id_template_id_key` — UNIQUE (campaign_id, template_id)
- `campaign_templates_campaign_id_fkey` — FK → campaigns(id) ON DELETE CASCADE
- `campaign_templates_template_id_fkey` — FK → email_templates(id) ON DELETE CASCADE

---

### 8. `custom_email_domains`

Custom sending domains registered by users.

| Column                | Type          | Nullable | Default           | Description                         |
|-----------------------|---------------|----------|-------------------|-------------------------------------|
| `id`                  | uuid          | NO       | gen_random_uuid()  | Primary key                         |
| `user_id`             | uuid          | NO       |                    | FK → users.id                       |
| `domain`              | text          | NO       |                    | Domain name (e.g., company.com)     |
| `resend_domain_id`    | text          | YES      |                    | Resend API domain ID                |
| `verification_status` | text          | YES      | 'pending'          | pending/verified/failed             |
| `dns_records`         | jsonb         | YES      |                    | Required DNS records                |
| `is_default`          | boolean       | YES      | false              | Default sending domain              |
| `verified_at`         | timestamptz   | YES      |                    | When domain was verified            |
| `created_at`          | timestamptz   | YES      | now()              | Creation date                       |
| `updated_at`          | timestamptz   | YES      | now()              | Last update date                    |

**Constraints:**
- `custom_email_domains_pkey` — PRIMARY KEY (id)
- `custom_email_domains_user_id_domain_key` — UNIQUE (user_id, domain)
- `custom_email_domains_user_id_fkey` — FK → users(id) ON DELETE CASCADE

---

## Relationships & Foreign Keys

### Cascade Delete Chain

```
users (DELETE)
├── campaigns (CASCADE)
│   ├── leads (CASCADE)
│   ├── email_logs (CASCADE)
│   └── campaign_templates (CASCADE)
├── user_template_cart (CASCADE)
└── custom_email_domains (CASCADE)

email_templates (DELETE)
├── user_template_cart (CASCADE)
└── campaign_templates (CASCADE)

leads (DELETE)
└── email_logs.lead_id (SET NULL)
```

### Relationship Diagram

```
users 1──────────────────────▶ * campaigns
users 1──────────────────────▶ * user_template_cart
users 1──────────────────────▶ * custom_email_domains

campaigns 1──────────────────▶ * leads
campaigns 1──────────────────▶ * email_logs
campaigns 1──────────────────▶ * campaign_templates

leads 1──────────────────────▶ * email_logs (nullable)

email_templates 1────────────▶ * user_template_cart
email_templates 1────────────▶ * campaign_templates
```

---

## Row Level Security (RLS)

### Current State
RLS policies are defined but currently **disabled** on most tables. The application uses the service role key (admin client) for database operations, which bypasses RLS.

### Defined Policies (for future enforcement)

#### `users` table
```sql
-- Users can read their own profile
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid()::text = auth_user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid()::text = auth_user_id);
```

#### `campaigns` table
```sql
-- Users can CRUD their own campaigns
CREATE POLICY "Users can manage own campaigns"
  ON campaigns FOR ALL
  USING (user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()::text
  ));
```

#### Pattern for all user-owned tables
All tables with `user_id` follow the same pattern:
1. SELECT: WHERE user_id matches authenticated user's users.id
2. INSERT: WHERE user_id matches authenticated user's users.id
3. UPDATE: WHERE user_id matches authenticated user's users.id
4. DELETE: WHERE user_id matches authenticated user's users.id

---

## Database Functions

### `requesting_user_id()`
Returns the current authenticated user's `users.id` based on their Supabase Auth ID.

```sql
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS uuid AS $$
  SELECT id FROM users
  WHERE auth_user_id = auth.uid()::text
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

**Used by:** RLS policies to resolve the link between `auth.uid()` (Supabase Auth UUID) and `users.id` (application UUID).

---

## Indexes

### Recommended indexes (some may already exist)

| Table                  | Index                                  | Columns                    |
|------------------------|----------------------------------------|----------------------------|
| `users`                | `users_auth_user_id_key`               | auth_user_id (UNIQUE)      |
| `users`                | `users_email_key`                      | email (UNIQUE)             |
| `campaigns`            | `campaigns_user_id_idx`                | user_id                    |
| `leads`                | `leads_campaign_id_idx`                | campaign_id                |
| `leads`                | `leads_email_idx`                      | email                      |
| `email_logs`           | `email_logs_campaign_id_idx`           | campaign_id                |
| `email_logs`           | `email_logs_lead_id_idx`               | lead_id                    |
| `email_templates`      | `email_templates_created_by_idx`       | created_by                 |
| `email_templates`      | `email_templates_scenario_idx`         | scenario                   |
| `user_template_cart`   | `user_template_cart_user_id_idx`       | user_id                    |
| `custom_email_domains` | `custom_email_domains_user_id_idx`     | user_id                    |

---

## Migration History

### Applied Migrations

| Migration                                        | Description                          |
|--------------------------------------------------|--------------------------------------|
| `20250101000000_initial_schema.sql` (approx.)    | Initial tables: users, campaigns, leads, email_logs |
| Template system migration                        | email_templates, user_template_cart, campaign_templates |
| Domain system migration                          | custom_email_domains table           |
| `20260218000001_migrate_to_supabase_auth.sql`    | Rename clerk_user_id → auth_user_id, update RLS policies |

### Pending Migration
The Supabase Auth migration SQL (`20260218000001_migrate_to_supabase_auth.sql`) needs to be run on the production database to:
1. Rename `clerk_user_id` column to `auth_user_id`
2. Update the `requesting_user_id()` function to use `auth.uid()`
3. Update all RLS policies to reference `auth_user_id` instead of `clerk_user_id`
