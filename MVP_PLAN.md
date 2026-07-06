# MVP Validation Plan — Job-Seeker Outreach Copilot

> **Goal:** turn the existing **Job Outreach** feature into a thin, focused MVP we can put in
> front of 15–20 real job seekers — to answer the two questions research left open:
> **(1) will people use it / pay?** and **(2) where do recruiter emails come from?**
> Minimum build, maximum learning. See `PRODUCT_SPEC.md` §13–§14 for why.

**Verdict after reading the code:** the core loop already works. We mostly *focus*, *harden*,
and add the *resume hook* + *measurement*. This is days of work, not weeks.

---

## Scope lock (2026-06-27) — recruiter outreach + smart timing

The founder is the ICP (job-seeking AI/full-stack engineer) and supplied real where/when/who
research. We automate the **high-response channel** (direct personalized email to the recruiter),
**not** auto-apply to job boards (saturated + TOS-ban trap, `PRODUCT_SPEC.md` §14). Two features
fold in from that research:

- **§5 Smart Send Scheduling (timezone)** — each target gets a region → the optimal recruiter
  send window, shown in the user's local time, and a "today's send plan" that surfaces which
  ready emails are in-window *now*. `lib/send-timing.ts` encodes the regions/windows.
  - MVP honesty: the Gmail **app password is session-only (never stored)**, so true unattended
    deferred autosend is **not** possible yet — that needs Gmail **OAuth (v1)**. MVP = timing
    *intelligence* + queue prioritization + user-approved send while in-app. State this in the UI.
- **§6 Region & role targeting** — tag targets by region (US/EU/UK/UAE/India…), pick a role preset
  (Full Stack AI Engineer, GenAI Engineer, LLM Engineer…) that tunes the AI's angle, and see the
  daily plan weighted (default US 60 / EU 30 / IN 10, adjustable).

**Quality bar for this build (ultracode):** must read as production enterprise software — use the
existing **shadcn/ui design system + tokens**, not raw gray/blue utilities (that ad-hoc styling is
what makes it look AI-made). Fast/no-lag: componentize, memoize target cards, debounce persistence.
Backend covered by **Vitest**; ship only after an **adversarial review** pass and **agent-browser**
end-to-end test on the founder's real resume.

---

## Current state (verified by reading the files)

| File | What it does today | Verdict |
|---|---|---|
| `app/(dashboard)/dashboard/job-outreach/page.tsx` | Manual profile + targets, generate, edit drafts, send one / send-all (3s spacing, confirm dialog). Profile+Gmail in localStorage; app password session-only. | **KEEP** core, extend |
| `lib/job-outreach-service.ts` | Gemini 1.5 Flash, solid prompt (<130 words, specific role, one proof point), JSON parse + text fallback. | **KEEP**, minor fixes |
| `app/api/job-outreach/generate/route.ts` | Auth-gated, validates, MAX_TARGETS=50. **No rate limit.** | **FIX** |
| `app/api/job-outreach/send/route.ts` | Auth-gated, nodemailer SMTP (`smtp.gmail.com:465`), HTML-escapes body, linkifies URLs. **No rate limit, no tracking.** | **FIX** |
| `components/dashboard/sidebar.tsx` | Nav shows the whole bulk-campaign product (Campaigns, Upload Leads, Create Campaign, Analytics, Domains). | **STRIP/HIDE** |
| `lib/rate-limit.ts` | In-memory fixed-window limiter + `tooManyRequests()`. Already used by `process-leads`. | **REUSE** |

---

## 1. STRIP / refocus (≈30 min) — make it look like one coherent product

The single biggest cheap win: a tester should see a **job-outreach tool**, not a half-built
bulk-email SaaS with the broken Resend path hanging around.

- **`components/dashboard/sidebar.tsx` (lines 19–29):** comment out (don't delete — reversible)
  `Campaigns`, `Upload Leads`, `Create Campaign`, `Domains`. Keep `Dashboard`, `Job Outreach`
  (make it the first/primary item), `Profile`, `Settings`. Decide on `Analytics` (hide unless it
  shows outreach stats).
- **`SidebarBrand` (lines 31–41):** retire the `Excel → AI → Emails` tagline; use the outreach
  story (e.g. "Get replies from recruiters").
- Leave `process-leads` / `process-campaign` / `campaigns` / `domains` routes in place but
  unreachable from nav. Don't expose the Resend bulk path to testers at all.

> ⚠️ The `/api/process-*` + Resend path is the TOS-risky bulk sender (`PRODUCT_SPEC.md` §12).
> Keep it dark for this MVP.

---

## 2. FIX / harden (≈1.5 hr) — must-do before real users touch it

1. **Rate-limit the two routes** — mirror `process-leads` exactly:
   - `generate/route.ts`: `rateLimit(`job-gen:${user.id}`, 10, 60_000)` → `tooManyRequests(rl)` on fail.
   - `send/route.ts`: `rateLimit(`job-send:${user.id}`, 20, 60_000)` (real emails + cost/abuse).
2. **Persist targets + drafts** so a refresh doesn't wipe a user's work. Cheapest: localStorage
   (same pattern as the profile already uses in `page.tsx`). The current code keeps targets/drafts
   in React state only — a reload loses everything, which will kill the test.
3. **Light prompt-injection guard in `job-outreach-service.ts`** — the pasted `jobDescription`
   comes from an external posting and is interpolated raw into the prompt (`buildPrompt`, ~line 116).
   Truncate + strip control chars / braces / backticks (copy the approach already in `ai-service.ts`).
   Low severity (self-serve), but cheap.
4. **Prerequisite, not feature work:** rotate the previously-committed secrets (Gemini/Supabase/
   Resend) before this is publicly reachable — they're in git history (`leadstenet-security-findings`).

---

## 3. ADD — the resume hook (≈2–3 hr) — the headline activation feature

This is the part that matches your vision ("students upload their resume…") and is the strongest
reason someone tries the tool.

- **UI:** add a "Upload résumé (PDF)" button at the top of `page.tsx`'s "Your details" card.
- **New route `app/api/job-outreach/parse-resume/route.ts`:** accept the PDF, send it to Gemini
  (inline base64, `application/pdf`) with a prompt to extract a structured `StudentProfile`
  (name, university, degree, grad year, skills, standout achievement, links). Return JSON.
  - **Recommended:** use Gemini's PDF understanding directly → **no new dependency.**
  - Auth-gate + rate-limit it like the others. Size-limit the file (~5 MB).
- **Prefill** the profile form from the result; **user reviews/edits** (never trust the parse).

> This converts the tedious 9-field form into "upload → confirm," which is the activation moment
> worth measuring.

---

## 4. ADD — measurement (≈1.5 hr) — so the test actually answers the question

Without this we learn nothing. Keep it minimal.

- **New table `outreach_events`** (new migration, RLS on `user_id`): row per meaningful action —
  `resume_uploaded`, `generated`, `sent` (with company/role/to_email/subject), `marked_replied`.
  Write the `sent` event from `send/route.ts` after a successful send.
- **Dashboard tile** (`app/(dashboard)/dashboard/page.tsx`): emails sent, this week, and a
  **reply count** — reframe the home page around outreach, not campaigns.
- **"Mark replied" toggle** on a sent draft → the one metric that matters. (Full reply-detection
  via Gmail read scope is later; manual is fine for validation.)
- **Willingness-to-pay probe (no billing build):** after a send, a light "Want follow-up reminders
  + unlimited sends? → Notify me about Pro" that just records intent. This is the cheapest real
  signal on the money question.
- **Email-sourcing signal:** optional one-tap "How did you find this email?" on a target — tells
  you whether to ever build a finder (Question 2).

---

## What we are explicitly NOT building for the MVP

- ❌ Gmail OAuth (app-password flow is fine to validate; OAuth is the v1 upgrade).
- ❌ Auto-send / "send 200" — keep the human-in-the-loop review + 3s spacing.
- ❌ Auto-applier / LinkedIn automation / scraping (TOS trap, `PRODUCT_SPEC.md` §12, §14).
- ❌ Dodo billing / plans / paywall — we're testing *intent*, not charging yet.
- ❌ Custom domains, bulk campaigns, Resend.

---

## Recommended build order

1. **§1 Strip/refocus** (30 min) — instantly a coherent product to demo.
2. **§2 Fix/harden** (1.5 hr) — safe to hand out.
3. **§3 Resume upload** (2–3 hr) — the hook.
4. **§4 Measurement** (1.5 hr) — turns usage into an answer.
5. Rotate secrets → deploy → put in front of 15–20 real job seekers.

**Total: ~1–1.5 focused days of build.** Then the users tell us if the business is real.

## Success signals to watch (define "go" before launching)
- Activation: % who upload a résumé and generate ≥1 email.
- Core value: % who actually **send**, and emails sent per active user.
- Retention: % who come back within 7 days and send again.
- Money: clicks on the "Pro" intent probe.
- Replies: any `marked_replied` events at all (the holy grail).
