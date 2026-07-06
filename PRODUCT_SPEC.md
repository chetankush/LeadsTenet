# Product Specification — Outreach Copilot (LeadsTenet, repositioned)

> **Status:** Draft v1 · Living document
> **Owner:** nikhil@wipiway.com
> **Last updated:** 2026-06-26
>
> This spec describes the repositioned product: a **resume-aware, send-from-your-own-inbox
> outreach copilot** for **job seekers** and **freelancers/solo-founders**. It replaces the
> "bulk AI cold-email SaaS" direction. Market research validating specifics is in progress;
> sections marked _[research-pending]_ may be refined.

---

## 1. Product in one sentence

> A copilot that turns your resume (or portfolio) into a small number of genuinely personalized
> outreach emails to the *right* person, lets you review and approve each one, sends them from
> **your own Gmail**, and reminds you to follow up — so you get **replies**, not spam folders.

### Why this and not "bulk AI cold email"
- The bulk cold-email category is saturated and its sending model (transactional ESP) is
  against TOS and burns sending domains.
- The hard part of outreach was never "writing a nice email" — it's **deliverability + getting
  to the right person + following up.** This product attacks exactly those.
- Sending from the user's **own inbox at low volume** sidesteps the deliverability problem
  entirely, and the **human-in-the-loop review** keeps quality high and avoids the "AI slop"
  backlash recruiters increasingly punish.

---

## 2. Core principles (these govern every design decision)

1. **Automate the tedium, keep the human on the judgment.** AI drafts; the user approves.
2. **Send from the user's own inbox.** Their Gmail, their reputation, their credibility.
3. **Quality over volume.** 10 great emails that get replies beat 200 in spam. Volume is
   capped and paced, never a one-click firehose.
4. **Be honest about data.** We never claim to magically auto-find every recruiter's email.
   We assist; the user confirms.
5. **Personalization must be visible.** Show *what* the AI referenced so the user trusts it.
6. **Follow-up is a first-class feature**, not an afterthought — it's where replies come from.

---

## 3. Target users (personas)

| Persona | Job to be done | Volume | Sends from |
|---|---|---|---|
| **Student / new grad** | "Get a recruiter to actually read my application for *this* role." | Low (5–30/wk) | Own Gmail |
| **Active job seeker** | "Reach hiring managers directly, track who I've contacted, follow up." | Low–med | Own Gmail / Workspace |
| **Freelancer / solo founder** | "Land my first/next clients with personalized outreach that doesn't feel like spam." | Low–med | Own Gmail / Workspace |

The **job seeker is the primary, sharpest ICP**. Freelancer is the **same engine, different nouns** (see §8).

---

## 4. Information architecture (sitemap)

```
PUBLIC
├── /                       Landing page (value prop, how-it-works, pricing, FAQ, contact)
├── /sign-in                Supabase Auth (email/password + Google)
├── /sign-up                Sign up
└── /pricing                (anchor on landing or standalone)

ONBOARDING (first-run, guided)
├── 1. Connect inbox        Gmail OAuth ("send as yourself")
├── 2. Upload resume        PDF → AI-parsed profile (confirm/edit)
└── 3. Goal & tone          Target roles / ideal client + writing tone

DASHBOARD (authenticated)
├── /dashboard              Home: next actions, stats, recent activity
├── /dashboard/profile      Resume-derived profile (skills, projects, target roles, tone)
├── /dashboard/targets      The outreach list: add/manage targets (company, role, contact)
│   └── /dashboard/targets/[id]   A single target: JD, draft, status, history
├── /dashboard/compose      Generate + review drafts (the AI + approval workspace)
├── /dashboard/tracker      Every email: drafted → sent → opened → replied + next action
├── /dashboard/followups    Pending follow-ups awaiting approval
├── /dashboard/settings     Account, connected inbox, tone defaults, danger zone
└── /dashboard/billing      Plan, usage, upgrade (Dodo Payments)
```

> **Note on existing pages:** the current app has `campaigns`, `upload`, `domains`, `analytics`,
> `job-outreach`. In the pivot: `job-outreach` becomes the core (`targets`+`compose`); `upload`
> is repurposed to **resume upload**; `campaigns`/`domains` (bulk + custom sending domains) are
> **removed/parked** — they belong to the bulk model we're leaving behind. `analytics` folds
> into `tracker`.

---

## 5. Page-by-page specification

For each page: **Purpose · Who sees it · Key elements · Functionality · Data · Edge cases.**

---

### 5.1 Landing page — `/`

- **Purpose:** Convert a visitor into a sign-up by making the value obvious in 5 seconds.
- **Who:** Public.
- **Key elements:**
  - Hero: headline ("Get replies from recruiters — emails written from your resume, sent from your Gmail"), sub-headline, primary CTA "Start free", short product visual/GIF of the flow.
  - "How it works" — 4 steps (Connect Gmail → Upload resume → Review drafts → Send & follow up).
  - Differentiator strip: *Sent from your own inbox · Personalized, not spam · You approve every email.*
  - Social proof _[research-pending: real testimonials]_.
  - Pricing preview (3 tiers, see §9).
  - FAQ (deliverability, "is this spam?", Gmail safety, data privacy).
  - Contact form → `POST /api/contact` (rate-limited per IP).
  - Footer (privacy, terms, contact).
- **Functionality:** Static marketing + working contact form. CTA routes to `/sign-up`.
- **Data:** Contact form submissions emailed to founder.
- **Edge cases:** Contact form validation + rate limiting; spam honeypot.

---

### 5.2 Sign in / Sign up — `/sign-in`, `/sign-up`

- **Purpose:** Authenticate via Supabase Auth.
- **Who:** Public → becomes authenticated.
- **Key elements:** Email/password fields, "Continue with Google" (Google OAuth via Supabase), links between sign-in/up, forgot-password.
- **Functionality:**
  - Email/password signup + login.
  - Google OAuth.
  - On first successful auth, a DB trigger auto-provisions a `users` profile row.
  - Redirect: new user → **onboarding**; returning user → `/dashboard`.
- **Data:** `auth.users` (Supabase) ↔ `public.users` (app profile).
- **Edge cases:** Email already registered; OAuth cancel; unverified email; password reset.

---

### 5.3 Onboarding (guided first-run)

A 3-step wizard shown once; each step is resumable. Cannot reach full dashboard value until inbox connected + resume parsed (but allow "skip for now" with nudges).

#### Step 1 — Connect inbox (Gmail OAuth)
- **Purpose:** Establish the sending identity. This is the trust + deliverability foundation.
- **Functionality:**
  - "Connect Gmail" → Google OAuth consent (scopes: send email as the user; optionally read-for-reply-detection later).
  - Store OAuth refresh token **encrypted, server-side** (never in localStorage).
  - Show connected account + a "send test email to yourself" verification.
  - **MVP fallback:** Gmail App Password via SMTP (session-only, never stored) — present as the
    interim option, with OAuth as the recommended path. _(This is what the codebase does today.)_
- **Data:** `inbox_connections` (user_id, provider, email, encrypted token, status).
- **Edge cases:** OAuth denied; token revoked later (detect on send, prompt reconnect); Workspace vs consumer Gmail (affects send limits — see §7.4).

#### Step 2 — Upload resume → profile
- **Purpose:** Capture the personalization fuel once.
- **Functionality:**
  - Upload PDF (size-limited, validated).
  - AI parses → structured profile: name, headline, education, skills, notable projects, achievements, links (portfolio/GitHub/LinkedIn), target roles.
  - User reviews and edits the parsed fields (always editable — parsing is never trusted blindly).
- **Data:** `profiles` (user_id, parsed JSON, raw resume file ref, target_roles, links).
- **Edge cases:** Unparseable/scanned PDF (fallback to manual entry); huge file; non-resume PDF (warn).

#### Step 3 — Goal & tone
- **Purpose:** Set defaults so generation is on-target from email #1.
- **Functionality:** Pick mode (**Job search** / **Freelance/clients**), target roles or ideal-client description, default tone (e.g., warm-professional / concise / enthusiastic).
- **Data:** stored on `profiles`/`users`.
- **Edge cases:** User can switch mode anytime in settings.

---

### 5.4 Dashboard home — `/dashboard`

- **Purpose:** Orient the user and surface the **next action**.
- **Who:** Authenticated.
- **Key elements:**
  - "Next actions" panel: *3 drafts awaiting review · 2 follow-ups due today · 1 reply received* (each links to the relevant page).
  - Stats this week: emails sent, open rate, **reply rate** (the metric that matters), follow-ups sent.
  - Recent activity feed (sent / opened / replied).
  - Quick "Add a target" button.
  - Onboarding completion nudges if inbox not connected / resume not uploaded.
- **Functionality:** Read-only aggregation + deep links. Pulls from `tracker`/usage data.
- **Data:** aggregates of `targets`, `email_logs`, `followups`, `usage_logs`.
- **Edge cases:** Empty state (no targets yet) → friendly "add your first target" CTA.

---

### 5.5 Profile — `/dashboard/profile`

- **Purpose:** The single source of truth the AI uses to personalize.
- **Key elements:** Parsed resume fields (editable), target roles / ideal-client description, links, default tone, re-upload resume button.
- **Functionality:**
  - Edit any field; changes affect future drafts (not already-sent ones).
  - Re-upload resume → re-parse (with confirm).
  - Mode toggle (job search ↔ freelance).
- **Data:** `profiles`.
- **Edge cases:** Empty profile blocks generation → prompt to complete.

---

### 5.6 Targets (outreach list) — `/dashboard/targets`

- **Purpose:** Manage *who* you're reaching out to. Solves the data problem honestly.
- **Key elements:**
  - Table of targets: Company · Role/Opportunity · Contact name · Email · Status (No draft / Draft ready / Sent / Replied) · Next action.
  - "Add target" (single) and "Add a few" (small batch, capped — e.g., ≤ plan limit).
  - Filters by status; search.
- **Add-a-target form:**
  - Company, role/opportunity.
  - **Job link or pasted JD** → AI extracts requirements, team, key skills (so the email can reference them).
  - **Contact email** (recruiter / hiring manager / prospect) — entered by the user.
    Helper guidance: "Find on the careers page / LinkedIn / company site."
    _[research-pending: whether to add an opt-in email-finder lookup that *suggests* an address
    with a confidence score — only if it can be done legally and accurately.]_
  - Optional contact name.
- **Functionality:** CRUD targets; JD extraction; status lifecycle. No auto-sending from here.
- **Data:** `targets` (user_id, company, role, contact_name, contact_email, jd_text, jd_extracted JSON, status, last_action_at).
- **Edge cases:** Duplicate target; invalid email; missing email (can draft but not send); JD URL unfetchable (fall back to paste).

---

### 5.7 Target detail — `/dashboard/targets/[id]`

- **Purpose:** Everything about one outreach in one place.
- **Key elements:** Contact + company info; extracted JD highlights; the current draft; status timeline (drafted → sent → opened → replied); follow-up schedule; notes.
- **Functionality:** Generate/regenerate draft for this target; jump to compose/review; schedule or send; log a manual reply.
- **Data:** `targets` + related `email_drafts`, `email_logs`, `followups`.
- **Edge cases:** No contact email yet (CTA to add); already replied (suppress further follow-ups).

---

### 5.8 Compose / Review — `/dashboard/compose`

> The heart of the product: AI generation **+** the human approval gate.

- **Purpose:** Turn profile × target into an approved, sendable email.
- **Key elements:**
  - Left: target context (role, JD highlights, contact). Right: the draft (subject + body).
  - **"What this references"** chips (e.g., "your React project ↔ their frontend role") — makes personalization visible and builds trust.
  - Inline editor for subject + body.
  - Quick-tweak buttons: *Shorter · Warmer · More specific · Less salesy · Regenerate.*
  - Resume auto-attached indicator.
  - Actions: **Approve & queue** / **Approve & send now** / **Schedule**.
  - Batch mode: review a small queue one-by-one ("Next →").
- **Functionality:**
  - On open, generate draft if none exists (AI: profile + JD + tone → subject/body).
  - Edits saved to the draft.
  - Tweak buttons re-prompt the AI with the modifier.
  - Approval moves status forward and (optionally) hands to the send queue.
  - **Guardrail:** if the user tries to approve many at once, show pacing/volume warning (§7.4).
- **Data:** `email_drafts` (target_id, subject, body, referenced JSON, version, status).
- **Edge cases:** AI failure → graceful fallback draft + retry; profile incomplete → block with prompt; over-long body → nudge to shorten.

---

### 5.9 Tracker — `/dashboard/tracker`

- **Purpose:** See every email and what to do next. (Replaces "analytics" for this product.)
- **Key elements:** Table/timeline: Contact · Company · Subject · Sent date · Status (Sent / Opened / Replied / Bounced) · Follow-up status · Next action. Filters; reply-rate summary at top.
- **Functionality:**
  - Status updates from send results and (optional) open/reply detection.
  - "Log reply manually" (since reply-detection may be limited).
  - Links into target detail / follow-up.
- **Data:** `email_logs`, `targets`, `followups`.
- **Edge cases:** Open tracking is **optional and off by default** — open-tracking pixels can hurt deliverability and feel creepy; offer it but explain the trade-off. Bounce handling (mark contact email invalid).

---

### 5.10 Follow-ups — `/dashboard/followups`

- **Purpose:** Surface and approve the polite nudges that actually drive replies.
- **Key elements:** List of targets with no reply after N days (default ~5); each shows an **AI-drafted follow-up** ready to review.
- **Functionality:**
  - Auto-generate follow-up drafts on a schedule (system job), but **never auto-send** — user approves.
  - Per-item: edit, approve & send, skip, or stop following up this contact.
  - Cap follow-ups per contact (e.g., max 2) to avoid pestering.
- **Data:** `followups` (target_id, sequence_no, draft, due_at, status).
- **Edge cases:** Reply received → cancel pending follow-ups automatically; contact bounced → don't follow up.

---

### 5.11 Settings — `/dashboard/settings`

- **Purpose:** Account + sending configuration.
- **Key elements / functionality:**
  - **Connected inbox:** show Gmail account, reconnect, disconnect, send-test.
  - **Sending preferences:** daily cap, pacing/throttle, open-tracking on/off, default send window.
  - **Tone & mode defaults.**
  - **Account:** name, email, password change.
  - **Privacy/data:** download my data, delete account (and tokens/resume).
  - **Danger zone:** delete account.
- **Data:** `users`, `inbox_connections`, preferences.
- **Edge cases:** Disconnecting inbox blocks sending (warn); deletion must revoke OAuth + purge resume/token.

---

### 5.12 Billing — `/dashboard/billing`

- **Purpose:** Plan + usage + upgrade via **Dodo Payments**.
- **Key elements:** Current plan, usage vs limits (emails/mo, targets, AI generations), upgrade/downgrade, manage subscription (Dodo portal), invoices.
- **Functionality:**
  - `POST /api/dodo/create-checkout-session` → hosted checkout.
  - `POST /api/dodo/create-portal-session` → manage subscription.
  - `POST /api/dodo/webhook` → sync subscription status to `users`.
  - Enforce plan limits across the app (server-side, never trust client).
- **Data:** `users` (subscription fields), `usage_logs`, `subscription_plans`.
- **Edge cases:** Webhook race/ordering; downgrade below current usage; failed payment → grace state.

---

## 6. Cross-cutting functionalities (the engine)

### 6.1 Resume parsing
- Input PDF → AI extracts structured profile JSON. User confirms. Re-runnable.
- Failure path: manual profile entry.

### 6.2 AI email generation
- Inputs: profile + target (role, company, JD-extracted highlights) + tone.
- Output: subject, body, and a list of "referenced" facts (for the trust chips).
- **All user/JD-supplied text is sanitized before prompting** (prompt-injection defense — already
  present in `lib/ai-service.ts`); treat external data as untrusted.
- Graceful fallback to a templated draft if the model fails.
- Model: Gemini today; keep provider swappable.

### 6.3 Sending (own inbox)
- Via Gmail OAuth (preferred) or App Password SMTP (MVP).
- **Paced/throttled**, never a synchronous blast. Move sending to a **background job/queue**
  (current inline-loop times out past ~30 emails — known issue to fix).
- Records every send to `email_logs`.

### 6.4 Follow-up scheduler
- Background job finds sent targets with no reply after N days, drafts a follow-up, queues it
  for **user approval**. Cancels on reply/bounce. Caps per contact.

### 6.5 Tracking
- Send/bounce status always. Open tracking optional (off by default). Reply detection later
  (needs Gmail read scope) — until then, manual "log reply".

### 6.6 Deliverability & abuse guardrails  _(see §7)_
- Daily caps, pacing, volume warnings, content checks (e.g., warn on too many links / spammy phrases).

### 6.7 Auth, security, multi-tenancy
- Supabase Auth; **RLS on every table** keyed to `auth.uid()`.
- OAuth/refresh tokens encrypted at rest, server-only.
- Rate limiting on AI/email/contact endpoints.
- **Open security items to close:** rotate previously-committed secrets; add rate limiting
  everywhere; sanitize all injected data; regenerate typed DB types. _(From prior security review.)_

### 6.8 Smart Send Scheduling (timezone) + region/role targeting
- Each target is tagged with a **region**; `lib/send-timing.ts` maps region → the optimal window to
  reach a recruiter (their local morning) and converts it to the **user's local time**. The UI shows
  per-target "best sent now / in N hrs" and a **Today's Send Plan** grouping ready emails by region.
- **Role presets** (Full Stack AI Engineer, GenAI Engineer, LLM Engineer, Applied AI, Founding
  Engineer…) tune the AI personalization angle.
- Default daily weighting US 60% / EU 30% / India 10% (adjustable) — from the founder's own research.
- ⚠️ **MVP constraint:** the Gmail app password is session-only, so the schedule is *timing
  intelligence + a prioritized queue the user sends while in-app*, **not** unattended autosend.
  True deferred send requires Gmail **OAuth** (planned v1). The UI must say so honestly.

---

## 7. Deliverability & ethics rules (non-negotiable)

These exist so the product stays *usable* and doesn't harm users' inboxes or reputations.

1. **No auto-blast.** Every email is user-approved. No "upload resume → fire 200 emails."
2. **Volume caps & pacing.** Cap well *below* the per-account ceilings and keep the spam-complaint
   rate under **0.10%** (Google's danger line is 0.30% — at/above it deliverability collapses).
   Start new users conservative and warn before risky days. _(Verified, see §14.)_
3. **Gmail/Workspace send limits respected (verified numbers):** consumer Gmail ≈ **500 messages/day**;
   paid Google Workspace = **2,000 messages/day** (≈2,000 unique external recipients/day; trial accounts
   500). Google's "bulk sender" compliance rules trigger above **5,000 messages/day** to Gmail (since
   Feb 1 2024) — but a single own-inbox hits the 500–2,000 cap and the 0.30% complaint ceiling *long
   before* that, which is exactly why an "outreach so much" model structurally breaks. _(Verified, see §14.)_
4. **Spam-reputation safety:** discourage link-heavy/obviously-templated emails; encourage
   genuine personalization; open-tracking off by default.
5. **Honest data sourcing.** Never scrape platforms in violation of TOS to harvest emails. The
   user supplies/confirms contact addresses; any finder integration is opt-in and labeled with
   confidence.
6. **Respect replies & opt-outs.** Stop following up on reply; honor "stop" requests.

---

## 8. Freelancer mode (same engine, different nouns)

| Job-seeker concept | Freelancer concept |
|---|---|
| Resume → profile | Portfolio / services / case studies → profile |
| Target = recruiter / hiring manager | Target = prospect / decision-maker |
| JD / job posting | A company matching the ideal-client profile |
| "Application for [role]" | "Can I help with [specific problem]" |

All pages, the AI engine, the review gate, sending, follow-ups — **identical**. Mode is a toggle
set in onboarding/profile that changes prompt framing and copy. This is why both audiences live
in one product.

---

## 9. Plans & limits (Dodo Payments)  _[numbers research-pending]_

| Plan | Price | Targets/mo | AI generations | Sends/mo | Follow-ups | Notes |
|---|---|---|---|---|---|---|
| **Free** | $0 | small (e.g. 10) | limited | low | manual | Try the full flow |
| **Pro** | $? | higher | higher | higher | auto-drafted | Active job seeker / freelancer |
| **Premium** | $? | highest | highest | highest | auto-drafted | Power users |

Limits enforced server-side via `usage_logs` + `subscription_plans`. Pricing to be set after
research on willingness-to-pay.

---

## 10. Data model (target shape)

```
users               ← auth + subscription (exists)
profiles            ← resume-derived profile, target roles, mode, tone   [new]
inbox_connections   ← Gmail OAuth/token, status                          [new]
targets             ← who we're reaching (replaces leads/campaigns)      [reshaped]
email_drafts        ← AI drafts + versions + "referenced" facts          [new]
email_logs          ← sends + status (exists, reused)
followups           ← scheduled nudges awaiting approval                 [new]
usage_logs          ← quota tracking (exists)
subscription_plans  ← plan reference (exists)
```
- **Removed/parked:** `campaigns`, `user_domains` (bulk + custom domains belong to the old model).
- All tables RLS-scoped to `auth.uid()`.
- Regenerate TypeScript types after schema changes (currently a stub).

---

## 11. Build phases

**Phase 0 — Foundation / cleanup (do first)**
- Rotate committed secrets; finish RLS/typed-DB hardening; rate-limit all endpoints.
- Move email sending to a background job/queue (fix the >30-email timeout).

**Phase 1 — MVP (job-seeker, single target at a time)**
- Auth → onboarding (connect Gmail via App Password MVP → upload resume → mode/tone).
- Targets (manual add + JD paste/extract) · Compose/Review · Send from inbox · basic Tracker.
- This is essentially hardening + reframing the existing **Job Outreach** feature into the core.

**Phase 2 — Stickiness**
- Gmail **OAuth** (replace app passwords) · Follow-up scheduler + approval · reply/bounce handling
  · richer Tracker (reply rate).

**Phase 3 — Freelancer mode + monetization**
- Mode toggle + freelancer prompts/copy · Dodo plans + limit enforcement · billing page.

**Phase 4 — Assist & scale (carefully)**
- Optional opt-in email-finder · small-batch review queues · templates/snippets · analytics on
  what gets replies.

---

## 12. What we deliberately DON'T build (anti-features)

- ❌ One-click mass auto-send / "blast 200 recruiters."
- ❌ Bulk sending via a transactional ESP (Resend) — burns domains, against TOS.
- ❌ LinkedIn/Indeed scraping or automation that risks account bans.
- ❌ Auto-submit-to-ATS "auto-applier" / LinkedIn automation as a core feature. **Research
  confirms this is a TOS + account-ban trap** (LinkedIn prohibits scraping/automation/extensions;
  Apollo.io & Seamless.ai were permanently banned March 2025; aggressive velocity trips anti-spam),
  and it feeds the "AI slop" recruiters actively penalize. Final call: **avoid as core.** (§14)
- ❌ Storing users' Gmail passwords. (App password is session-only; OAuth tokens encrypted.)

---

## 13. Open questions

**Resolved by research (§14):**
- ✅ Gmail/Workspace send limits & complaint thresholds — see §7 and §14.
- ✅ Is auto-apply / LinkedIn automation a safe core feature? — No, it's a TOS/ban trap. Avoided.
- ✅ Does high volume break the model? — Yes, structurally (deliverability + backlash).

**Still open (research could NOT answer — treat as risk, validate before heavy build):**
- ❓ **Will anyone pay, and who pays most?** Demand signals & willingness-to-pay for job-seeker vs
  freelancer were not substantiated. *This is the #1 thing to validate cheaply first.*
- ❓ **Where do recruiter/hiring-manager emails come from, legally?** Central to the flow, unanswered.
  LinkedIn scraping is banned; GDPR/CNIL precedent exists (KASPR fined €240k). Must design honest sourcing.
- ❓ **Does personalization actually convert better, and by how much?** The qualitative case is strong
  (backlash against generic mass outreach) but every specific conversion-lift figure was *refuted* — so
  the quantitative ROI is unproven.
- ❓ Reply-detection approach (Gmail read scope vs manual logging) and privacy implications.
- ❓ Verified competitor pricing/traction (the pricing figures found were refuted — needs fresh primary check).
- ❓ Whether to launch job-seeker-only or include freelancer mode day one.

---

## 14. Market research findings (verified 2026-06-26)

Method: 6 search angles, 26 sources fetched, 120 claims extracted, top 25 adversarially verified
(3 independent skeptics each; needs 2/3 to confirm). **16 confirmed, 9 killed.** The killed claims
matter as much as the confirmed ones — see "Refuted / unproven" below.

### ✅ Confirmed (high confidence)
1. **Hiring is in an "AI doom loop."** Seekers use AI to apply to more jobs; employers use AI to
   filter them back out; trust is at a low for both sides.
   *Greenhouse 2025 AI in Hiring Report (n=4,136); Fortune, Nov 2025.*
2. **High volume is the problem, not the solution.** LinkedIn applications rose **45%+ YoY to
   ~11,000/minute** (June 2025); **49%** of seekers apply more than a year ago; **34%** of recruiters
   spend up to half their week filtering spam/junk.
   *LinkedIn data via NYT/Semafor (June 2025); Greenhouse (Nov 2025).*
3. **Recruiters detect & penalize obvious/deceptive AI outreach.** 65% have caught deceptive AI use;
   per a 600-manager TopResume survey, 33.5% claim to spot an AI-written application in <20s and ~20%
   reject it outright. *(Scoped to deceptive/obvious AI — not all AI assistance. Vendor-biased
   sources, self-report likely inflated.)* *Greenhouse; TopResume.*
4. **Deliverability math kills "outreach so much."** Consumer Gmail ≈500/day, Workspace =2,000/day;
   must keep spam complaints **<0.10%** (never ≥0.30%); bulk-sender rules trigger >5,000/day. One own
   inbox hits the account cap + complaint ceiling well before any volume that would matter.
   *Google Workspace & Postmaster primary docs.*
5. **Auto-apply / LinkedIn automation = TOS + ban trap.** LinkedIn prohibits scraping/automation/
   extensions; aggressive velocity (100+ apps/hr) trips anti-spam; Apollo.io & Seamless.ai permanently
   banned (Mar 2025); CNIL fined KASPR €240k for non-consensual LinkedIn data collection.
   *LinkedIn Help & User Agreement; hiQ v. LinkedIn; CNIL.*

### ❌ Refuted / unproven (do NOT rely on these)
- Competitor **pricing** figures (LazyApply $12.99, Massive/Jobright $30, etc.) — refuted/unverified.
- **Personalization conversion-lift** numbers (115% more interviews, 2.3×, 5.75% vs 2.68%) — all refuted.
- Auto-apply success-rate anecdotes (Wonsulting ~2%, Sonara 1/700) — refuted.
- Cold-application "0.1–2% success rate" — refuted.

### ⚠️ Caveats
- Two strongest sentiment sources (Greenhouse = ATS that sells an anti-spam product; TopResume = paid
  resume service) have incentives to amplify the "AI applications are spammy/risky" narrative —
  mitigated but not eliminated by NYT/Fortune/Semafor corroboration.
- Sentiment data anchored to mid/late-2025 in a fast-moving field. Deliverability/TOS facts are
  current 2026 with enforcement intensifying since Nov 2025.

### Bottom line
Research **strongly confirms what to avoid** (volume, auto-apply, scraping) and confirms the *shape*
of the wedge (low-volume, personalized, own-inbox, human-in-loop) avoids every documented failure
mode. It does **not** prove the upside (that people will pay, that personalization converts, where
emails come from). Those are the real risks to validate before building heavily.
