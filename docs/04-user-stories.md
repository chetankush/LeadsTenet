# LeadGen AI — User Stories

## Table of Contents
1. [Personas](#personas)
2. [Epic 1: Authentication & Onboarding](#epic-1-authentication--onboarding)
3. [Epic 2: Lead Management](#epic-2-lead-management)
4. [Epic 3: Campaign Management](#epic-3-campaign-management)
5. [Epic 4: AI Content Generation](#epic-4-ai-content-generation)
6. [Epic 5: Email Delivery](#epic-5-email-delivery)
7. [Epic 6: Template Management](#epic-6-template-management)
8. [Epic 7: Dashboard & Analytics](#epic-7-dashboard--analytics)
9. [Epic 8: Custom Domains](#epic-8-custom-domains)
10. [Epic 9: Subscription & Billing](#epic-9-subscription--billing)
11. [Epic 10: Profile & Settings](#epic-10-profile--settings)

---

## Personas

### Sarah — Startup Founder
- Small B2B SaaS startup, 5-person team
- Needs to generate leads and close deals fast
- Limited marketing budget, does outreach herself
- Free plan user considering Pro upgrade

### Mike — Sales Development Rep (SDR)
- Works at mid-size tech company
- Sends 200+ outreach emails per week
- Uses LinkedIn and email in tandem
- Pro plan user

### Lisa — Marketing Agency Owner
- Manages campaigns for 10+ clients
- Needs templates, custom domains, team features
- High volume email sending
- Enterprise plan user

---

## Epic 1: Authentication & Onboarding

### US-1.1: Sign Up with Email
**As** a new visitor,
**I want to** create an account using my email and password,
**So that** I can start using the platform.

**Acceptance Criteria:**
- Form validates email format and password strength
- Successful signup creates auth account + user profile in database
- User is redirected to dashboard after signup
- Error messages shown for duplicate email or weak password
- Full name is captured during registration

**Implementation:**
- Page: `app/(auth)/sign-up/page.tsx`
- API: Supabase `auth.signUp()` + `POST /api/user/profile`

---

### US-1.2: Sign Up with OAuth
**As** a new visitor,
**I want to** sign up using my Google or GitHub account,
**So that** I can get started quickly without creating a new password.

**Acceptance Criteria:**
- Google and GitHub OAuth buttons are visible on sign-up page
- Clicking OAuth button redirects to provider, then back to app
- User profile is created automatically after OAuth callback
- If user already exists with that email, account is linked

**Implementation:**
- Page: `app/(auth)/sign-up/page.tsx`
- Callback: `app/auth/callback/route.ts`

---

### US-1.3: Sign In
**As** a returning user,
**I want to** sign in with my email/password or OAuth,
**So that** I can access my campaigns and data.

**Acceptance Criteria:**
- Both email/password and OAuth sign-in options available
- Invalid credentials show clear error message
- Successful sign-in redirects to dashboard
- Session persists across page refreshes (cookie-based JWT)
- Expired sessions are automatically refreshed via middleware

**Implementation:**
- Page: `app/(auth)/sign-in/page.tsx`
- Middleware: `middleware.ts` (token refresh)

---

### US-1.4: Sign Out
**As** a logged-in user,
**I want to** sign out of my account,
**So that** my session is ended securely.

**Acceptance Criteria:**
- Sign-out button visible in dashboard header
- Clicking sign-out clears session cookies
- User is redirected to home page or sign-in page
- Protected routes are no longer accessible

**Implementation:**
- Component: `components/dashboard/header.tsx`
- Action: `supabase.auth.signOut()`

---

### US-1.5: Route Protection
**As** a platform operator,
**I want** unauthenticated users to be redirected to sign-in when accessing dashboard,
**So that** user data is protected.

**Acceptance Criteria:**
- All `/dashboard/*` routes require authentication
- Unauthenticated access redirects to `/sign-in`
- Auth pages (`/sign-in`, `/sign-up`) are accessible without auth
- Landing page (`/`) is public

**Implementation:**
- Middleware: `middleware.ts`

---

## Epic 2: Lead Management

### US-2.1: Upload Leads from CSV
**As** Sarah (startup founder),
**I want to** upload a CSV file containing my leads,
**So that** I can create an outreach campaign from my contact list.

**Acceptance Criteria:**
- Drag-and-drop or file picker for CSV upload
- CSV is parsed client-side (no server upload of raw file)
- Preview table shows parsed data before confirmation
- Common column names are auto-mapped (name, email, company, etc.)
- Extra columns are stored as custom_fields
- Validation: email format check, required fields highlighted
- Plan limit enforced (Free: 100, Pro: 500, Enterprise: 1000 leads per upload)

**Implementation:**
- Page: `app/(dashboard)/dashboard/upload/page.tsx`
- Library: Papa Parse for CSV parsing

---

### US-2.2: View Lead Data
**As** Mike (SDR),
**I want to** view all leads in a campaign with their status,
**So that** I can track which leads have been contacted.

**Acceptance Criteria:**
- Campaign detail page shows lead table
- Each lead shows: name, email, company, status
- Lead statuses: pending, contacted, replied, bounced
- Sortable and searchable lead list

**Implementation:**
- Page: `app/(dashboard)/dashboard/campaigns/[id]/page.tsx`
- API: `GET /api/campaigns/[id]` (includes leads)

---

### US-2.3: Lead Status Tracking
**As** Mike (SDR),
**I want** lead statuses to update automatically when emails are sent,
**So that** I know which leads have been reached.

**Acceptance Criteria:**
- Lead status changes from `pending` to `contacted` after email is sent
- Failed deliveries update lead status to `bounced`
- Status changes are reflected in campaign detail view

**Implementation:**
- API: `POST /api/process-campaign` (updates lead status after sending)

---

## Epic 3: Campaign Management

### US-3.1: Create Campaign
**As** Sarah,
**I want to** create a new email campaign with my uploaded leads,
**So that** I can organize my outreach efforts.

**Acceptance Criteria:**
- Campaign created with name, email subject, body template
- Sender email and name configurable
- Reply-to address configurable
- Leads attached to campaign from CSV upload
- Campaign starts in "draft" status
- Campaign count checked against plan limit

**Implementation:**
- API: `POST /api/campaigns`
- Page: `app/(dashboard)/dashboard/upload/page.tsx` (campaign creation from upload)

---

### US-3.2: View Campaign List
**As** Mike,
**I want to** see all my campaigns in one place,
**So that** I can manage my outreach pipeline.

**Acceptance Criteria:**
- List shows all campaigns with: name, status, lead count, date created
- Campaigns sorted by most recent first
- Status badges (draft, active, completed, paused)
- Click to navigate to campaign detail

**Implementation:**
- Page: `app/(dashboard)/dashboard/campaigns/page.tsx`
- API: `GET /api/campaigns`

---

### US-3.3: View Campaign Details
**As** Mike,
**I want to** view a single campaign's details including leads and email logs,
**So that** I can monitor campaign performance.

**Acceptance Criteria:**
- Campaign overview: name, status, dates, sender info
- Lead list with individual statuses
- Email log showing sent/failed/opened per lead
- Summary stats: total sent, success rate, open rate

**Implementation:**
- API: `GET /api/campaigns/[id]`
- API: `GET /api/campaigns/[id]/emails`

---

### US-3.4: Update Campaign
**As** Sarah,
**I want to** edit a campaign's details before sending,
**So that** I can refine my message.

**Acceptance Criteria:**
- Edit campaign name, subject, body, sender info
- Only editable when campaign is in "draft" status
- Changes saved immediately

**Implementation:**
- API: `PUT /api/campaigns/[id]`

---

### US-3.5: Delete Campaign
**As** Sarah,
**I want to** delete a campaign I no longer need,
**So that** my dashboard stays clean.

**Acceptance Criteria:**
- Delete button with confirmation dialog
- Deleting a campaign removes all associated leads and email logs
- Cannot undo deletion

**Implementation:**
- API: `DELETE /api/campaigns/[id]`

---

### US-3.6: Process Campaign (Send Emails)
**As** Sarah,
**I want to** trigger my campaign to send personalized emails to all leads,
**So that** my outreach is executed automatically.

**Acceptance Criteria:**
- "Send Campaign" button on campaign detail page
- AI generates personalized content for each lead
- Emails sent via Resend API
- Progress tracking during send
- Campaign status updates to "active" then "completed"
- Email logs created for each sent email
- Lead statuses updated after sending
- Usage limit checked before sending (emails remaining this month)

**Implementation:**
- API: `POST /api/process-campaign`
- Services: AIService → EmailService → DatabaseService

---

## Epic 4: AI Content Generation

### US-4.1: Generate Personalized Email
**As** Mike,
**I want** the AI to generate a personalized email for each lead using their data,
**So that** my outreach feels genuine and not templated.

**Acceptance Criteria:**
- AI uses lead name, company, industry, and any custom fields
- Generated email sounds human, not AI-written
- Subject line is personalized
- Body is 60-80 words
- Tone is friendly, conversational
- No corporate jargon or AI clichés

**Implementation:**
- Service: `lib/ai-service.ts` (generateChannelContent)
- Model: OpenRouter → Gemini 2.0 Flash

---

### US-4.2: Preview AI-Generated Email
**As** Sarah,
**I want to** preview what the AI will generate before sending a full campaign,
**So that** I can verify the quality and tone.

**Acceptance Criteria:**
- "Preview" feature generates a sample email for one lead
- Shows subject, body, tone, and CTA
- Can regenerate for different results
- Preview doesn't count toward email sending limits

**Implementation:**
- Page: `app/(dashboard)/dashboard/email-example/page.tsx`
- API: `POST /api/sample-email`

---

### US-4.3: Multi-Channel Content
**As** Mike,
**I want** AI to generate content for email, LinkedIn, and Twitter,
**So that** I can run multi-channel outreach campaigns.

**Acceptance Criteria:**
- Select channels when creating campaign: email, linkedin, twitter
- AI generates channel-appropriate content:
  - Email: 60-80 words, formal structure
  - LinkedIn: Under 60 words, connection message style
  - Twitter: Under 40 words, DM style
- Each channel has its own subject, body, tone, CTA

**Implementation:**
- Service: `lib/ai-service.ts` (processLeads with channel array)

---

### US-4.4: AI Confidence Scoring
**As** a platform operator,
**I want** each AI-generated email to have a confidence score,
**So that** I can flag low-quality content.

**Acceptance Criteria:**
- Score calculated from available lead data completeness
- Base: 50 points
- +15 for name, +15 for email
- +10 for company, +10 for industry
- +2 per additional field (max +10)
- Maximum: 95 points
- Low confidence (<70) leads flagged for review

**Implementation:**
- Service: `lib/ai-service.ts` (calculateConfidence)

---

### US-4.5: Fallback Content
**As** a platform operator,
**I want** fallback email content when AI generation fails,
**So that** campaigns aren't blocked by AI errors.

**Acceptance Criteria:**
- If AI API call fails, use pre-written fallback templates
- Fallback still personalizes with lead name, company, industry
- Campaign continues processing other leads
- Errors logged but not blocking

**Implementation:**
- Service: `lib/ai-service.ts` (createFallbackContent)

---

## Epic 5: Email Delivery

### US-5.1: Send Email via Resend
**As** Sarah,
**I want** my campaign emails to be delivered reliably,
**So that** my leads actually receive my outreach.

**Acceptance Criteria:**
- Emails sent via Resend API
- HTML formatted email body
- Configurable from email, from name, reply-to
- Delivery status tracked (sent/bounced)
- Rate limiting to avoid API throttling

**Implementation:**
- Service: `lib/email-service.ts`

---

### US-5.2: Email Delivery Logging
**As** Mike,
**I want to** see the delivery status of every email I've sent,
**So that** I can track deliverability.

**Acceptance Criteria:**
- Email log per sent email: to, from, subject, status, timestamp
- Statuses: sent, bounced, opened, clicked
- Viewable on campaign detail page
- Filterable by status

**Implementation:**
- API: `GET /api/campaigns/[id]/emails`
- Database: `email_logs` table

---

### US-5.3: Custom Sender Email
**As** Lisa (agency owner),
**I want to** send emails from my custom domain,
**So that** outreach looks professional and builds trust.

**Acceptance Criteria:**
- Use verified custom domain as sender email
- Fall back to default domain if no custom domain set
- From name configurable per campaign

**Implementation:**
- Campaign field: `from_email`, `from_name`
- Domain verification: `lib/domain-service.ts`

---

## Epic 6: Template Management

### US-6.1: Browse Template Gallery
**As** Sarah,
**I want to** browse pre-made email templates,
**So that** I can find the right starting point for my outreach.

**Acceptance Criteria:**
- Gallery view of all available templates
- Filter by mood tag (professional, friendly, urgent, etc.)
- Filter by scenario (introduction, follow-up, pitch, etc.)
- Search by name or content
- System templates available to all users
- User-created templates only visible to creator

**Implementation:**
- Page: `app/(dashboard)/dashboard/templates/page.tsx`
- API: `GET /api/templates?mood=X&scenario=Y`

---

### US-6.2: Create Custom Template
**As** Mike,
**I want to** create my own email templates with variables,
**So that** I can reuse my best-performing outreach patterns.

**Acceptance Criteria:**
- Template editor with name, content, subject line
- Support `{{variable}}` placeholders
- Select mood tags and scenario type
- Define variables with labels and default values
- Preview template with sample data
- Save as draft or active

**Implementation:**
- Page: `app/(dashboard)/dashboard/templates/page.tsx` (editor mode)
- API: `POST /api/templates`

---

### US-6.3: Edit/Delete Template
**As** Mike,
**I want to** edit or delete my custom templates,
**So that** I can keep my template library current.

**Acceptance Criteria:**
- Edit any field of user-created templates
- Cannot edit system templates
- Delete with confirmation
- Template deletion doesn't affect already-sent campaigns

**Implementation:**
- API: `PUT /api/templates/[id]`, `DELETE /api/templates/[id]`

---

### US-6.4: Save Templates to Cart
**As** Sarah,
**I want to** save my favorite templates to a personal collection,
**So that** I can quickly access them later.

**Acceptance Criteria:**
- "Save" button on each template card
- Cart shows all saved templates
- Toggle favorite status
- Add custom notes to saved templates
- Organize into folders (optional)

**Implementation:**
- API: `POST /api/templates/cart` (add), `DELETE /api/templates/cart/[id]` (remove)

---

### US-6.5: Template Variables
**As** Lisa,
**I want** templates to support dynamic variables like `{{name}}` and `{{company}}`,
**So that** templates are reusable across different campaigns.

**Acceptance Criteria:**
- `{{variable}}` syntax in template content and subject
- Auto-extraction of variables from template text
- Variable replacement with lead data at send time
- Unreplaced variables show placeholder text
- Variables configurable with labels, descriptions, defaults

**Implementation:**
- Utility: `lib/types/template.ts` (extractVariables, replaceVariables)

---

## Epic 7: Dashboard & Analytics

### US-7.1: View Dashboard Overview
**As** Sarah,
**I want to** see a summary of my campaigns and usage on the dashboard,
**So that** I can quickly understand my outreach performance.

**Acceptance Criteria:**
- Stats cards: total campaigns, total leads, emails sent this month
- Usage progress bar (emails sent / plan limit)
- Trend indicators (up/down from previous period)
- Quick action buttons (upload leads, create campaign)
- Current plan displayed

**Implementation:**
- Page: `app/(dashboard)/dashboard/page.tsx`
- API: `GET /api/dashboard/usage`

---

### US-7.2: Track Monthly Usage
**As** Sarah,
**I want to** see how many emails I've sent against my plan limit,
**So that** I know when I'm approaching my limit and need to upgrade.

**Acceptance Criteria:**
- Progress bar: X of Y emails sent this month
- Warning at 80% usage
- Block at 100% usage
- Plan upgrade CTA when approaching limit
- Monthly reset tracked

**Implementation:**
- API: `GET /api/dashboard/usage`
- Enforcement: checked before campaign processing

---

## Epic 8: Custom Domains

### US-8.1: Add Custom Domain
**As** Lisa,
**I want to** add my company's email domain for sending,
**So that** outreach emails come from my brand.

**Acceptance Criteria:**
- Enter domain name (e.g., `company.com`)
- System registers domain with Resend
- Required DNS records displayed (SPF, DKIM, MX)
- Domain saved with "pending" status

**Implementation:**
- API: `POST /api/user/domains`
- Service: `lib/domain-service.ts`

---

### US-8.2: Verify Custom Domain
**As** Lisa,
**I want to** verify my domain after adding DNS records,
**So that** I can start sending from my custom domain.

**Acceptance Criteria:**
- "Verify" button triggers DNS check via Resend API
- Status updates: pending → verified or failed
- Clear error message if verification fails
- Re-verification possible after fixing DNS

**Implementation:**
- API: `POST /api/user/domains/[domainId]/verify`

---

### US-8.3: Set Default Domain
**As** Lisa,
**I want to** set a default sending domain,
**So that** new campaigns automatically use my custom domain.

**Acceptance Criteria:**
- "Set as Default" button on verified domains
- Only one default domain at a time
- Default used when creating new campaigns

**Implementation:**
- API: `POST /api/user/domains/[domainId]/set-default`

---

## Epic 9: Subscription & Billing

### US-9.1: View Pricing Plans
**As** Sarah,
**I want to** compare available plans and their features,
**So that** I can choose the right plan for my needs.

**Acceptance Criteria:**
- Three plans displayed: Free, Pro ($49/mo), Enterprise ($149/mo)
- Feature comparison table
- Current plan highlighted
- "Upgrade" button for higher plans
- "Current Plan" badge for active plan

**Implementation:**
- Page: `app/(dashboard)/dashboard/pricing/page.tsx`

---

### US-9.2: Subscribe to Paid Plan
**As** Sarah,
**I want to** upgrade to the Pro plan,
**So that** I can send more emails and create more campaigns.

**Acceptance Criteria:**
- Click "Upgrade" redirects to Stripe Checkout
- Support for credit card payment
- Promotion code support
- After payment, plan is upgraded immediately
- Webhook updates user's plan_type in database
- Usage limits updated to new plan immediately

**Implementation:**
- API: `POST /api/stripe/create-checkout-session`
- Webhook: `POST /api/stripe/webhook`

---

### US-9.3: Manage Subscription
**As** Mike,
**I want to** manage my subscription (view invoices, cancel),
**So that** I have control over my billing.

**Acceptance Criteria:**
- "Manage Subscription" opens Stripe Customer Portal
- Portal allows: view invoices, update payment, cancel subscription
- Cancellation processed at end of billing period
- Downgrade to Free plan after cancellation

**Implementation:**
- API: `POST /api/stripe/create-portal-session`

---

## Epic 10: Profile & Settings

### US-10.1: Update Profile
**As** Sarah,
**I want to** update my profile information,
**So that** my account reflects my current details.

**Acceptance Criteria:**
- Edit: full name, company name, industry, phone, website
- Changes saved immediately
- Success toast confirmation
- Profile data used in email personalization (sender info)

**Implementation:**
- Page: `app/(dashboard)/dashboard/profile/page.tsx`
- API: `PUT /api/user/profile`

---

### US-10.2: View Settings
**As** Mike,
**I want to** manage my account settings,
**So that** I can control notifications, integrations, and preferences.

**Acceptance Criteria:**
- Settings page with categorized options
- Account info section
- Notification preferences
- Integration settings (API keys display)

**Implementation:**
- Page: `app/(dashboard)/dashboard/settings/page.tsx`
- API: `GET/PUT /api/user/settings`

---

### US-10.3: Delete Account
**As** a user,
**I want to** permanently delete my account and all my data,
**So that** my personal information is removed from the platform.

**Acceptance Criteria:**
- Delete button with confirmation dialog
- Requires explicit confirmation (type "DELETE" or similar)
- Deletes: user profile, all campaigns, all leads, all email logs, all templates
- Deletes Supabase auth account
- Cancels any active Stripe subscription
- Redirects to home page after deletion
- Action is irreversible

**Implementation:**
- API: `DELETE /api/user/delete`
- Cascade: PostgreSQL foreign key cascading deletes

---

## Story Map Summary

```
                    Authentication    Lead Mgmt    Campaigns    AI Content    Email        Templates    Analytics    Domains      Billing
                    ─────────────     ─────────    ─────────    ──────────    ─────        ─────────    ─────────    ───────      ───────
Must Have           US-1.1 Sign up    US-2.1       US-3.1       US-4.1       US-5.1       US-6.1       US-7.1       US-8.1       US-9.1
(MVP)               US-1.3 Sign in    Upload CSV   Create       Personalize  Send email   Browse       Dashboard    Add domain   View plans
                    US-1.5 Protect                 US-3.2       US-4.5       US-5.2                                              US-9.2
                                                   List         Fallback     Log status                                          Subscribe

Should Have         US-1.2 OAuth      US-2.2       US-3.3       US-4.2       US-5.3       US-6.2       US-7.2       US-8.2       US-9.3
                    US-1.4 Sign out   View leads   Details      Preview      Custom       Create       Usage        Verify       Manage sub
                                      US-2.3       US-3.4                    sender       US-6.3       tracking     US-8.3
                                      Status       Update                                 Edit/Delete               Set default

Nice to Have                                       US-3.5       US-4.3       US-5.4*      US-6.4                                 US-10.3
                                                   Delete       Multi-ch     Open track   Cart                                   Delete acct
                                                   US-3.6       US-4.4                    US-6.5
                                                   Process      Confidence                Variables
```

*US-5.4 (email open tracking) is referenced but not fully implemented yet.
