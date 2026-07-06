# LeadsTenet — Landing Page Design Brief

> **For:** the designer (freelance / studio / in-house)
> **From:** Founder + Product
> **Version:** 1.0 · Premium landing redesign
> **Deliverable:** a world-class, enterprise-grade marketing landing page — minimal, confident, premium.
> **Read time:** ~15 min. Section 12 is a paste-ready creative prompt if you want the short version.

---

## 0. TL;DR (the whole brief in six lines)

- **Product:** a premium job-hunt cockpit — turn your résumé into *personalized* emails to recruiters, sent from **your own inbox**, timed to land in **their morning**; plus job discovery, follow-ups, and tracking.
- **Audience:** design-literate AI/tech professionals who are *skeptical of growth-hack tools*.
- **The core insight:** for this audience, **radical restraint = trust**. A page that looks *authored and edited* (not generated) argues our "quality over quantity, no-spam" thesis before a word is read.
- **Aesthetic:** Swiss-editorial minimalism — newsprint white, ink black, one rationed warm accent, **big confident type by restraint (not weight)**, half-empty viewports, a single honest signature interaction.
- **The one thing to nail:** the hero must *demonstrate* the product's promise (one edited email, from your inbox, timed to their morning) as a real artifact — **not** describe it with a floating screenshot.
- **Creative latitude:** the strategy and guardrails (Sections 1–3, 8) are fixed; the *composition, craft, and experiments* (Sections 4, 6, 11) are yours to own.

---

## 1. Business context (why this page exists)

**The product.** LeadsTenet helps ambitious job seekers land interviews by reaching the *right person* with a genuinely personalized email — sent from their own Gmail, timed to arrive in the recruiter's local morning — instead of mass-applying into the void. It also finds roles, drafts polite follow-ups, and tracks the whole hunt.

**The market truth we're leaning into.** Hiring is drowning in AI spam (LinkedIn sees ~11,000 applications/minute; recruiters spend up to half their week deleting AI-generated slop). Auto-apply bots and mass-blasters are the *problem*. Our entire positioning is the **opposite**: fewer, sharper, well-timed, human-approved emails. **Quality over quantity. No auto-apply. No scraping. You approve every send.**

**Why design carries the argument.** Our ICP has seen a thousand gradient-blob "AI SaaS" templates and reads them instantly as growth-hack tells. We cannot *claim* premium and trustworthy — we must *look* it, through craft and restraint. The landing page is the first proof that this tool was made by people with taste.

**Primary goal of the page:** convert a design-literate professional to **start free** (sign up).
**Secondary goals:** communicate what it does in ~5 seconds; establish trust and premium credibility; make the differentiators (own inbox · smart timing · you approve) unmistakable.

**Success criteria (how we'll judge it):**
- A stranger grasps *what it is and why it's different* within one viewport.
- The page reads **premium and trustworthy** to a skeptical senior engineer (qualitative gut-check).
- Primary CTA click-through and scroll-depth beat the current page.
- Zero "templated AI SaaS" tells (see the kill-list, Section 8).

---

## 2. Audience & positioning

**Primary ICP:** ambitious AI/tech job seekers, ~2+ years' experience (engineers, GenAI/full-stack, applied-AI), targeting **US / EU / India** remote roles. Design-literate, taste-sensitive, allergic to hype. They admire Linear, Vercel, Stripe, Raycast.

**Secondary:** freelancers/solo-founders doing personalized client outreach (same engine).

**Positioning statement:** *The honest way to reach recruiters — a few genuinely personalized emails from your own inbox, timed to land in their morning. The opposite of spray-and-pray.*

**Brand personality:** authored · exacting · engineered-calm · quietly expensive · honest. **Not** playful, not loud, not "disruptive." Think editorial masthead + rail timetable, not startup confetti.

**Voice in copy (for reference — final copy TBD with product):** short, declarative, confident, a little literary. No exclamation marks. No "supercharge / revolutionize / 10x." Say true things plainly.

---

## 3. Non-negotiables (the guardrails)

These are fixed. Everything else is yours.

1. **Restraint over persuasion theater.** Big type, generous whitespace (~half of every viewport intentionally empty), monochrome + **one** rationed accent (accent ≤ ~5% of surface).
2. **Big type by restraint, not weight.** Display weight ~500 (medium), tight tracking, tight leading, **left-aligned**. Never 900-black, never centered heroes.
3. **The page IS the product.** Demonstrate the promise with a real, honest artifact (an actual email + a timing device). **No** floating product screenshots in rounded browser chrome, **no** stock imagery.
4. **The demo email must be real and specific** — a genuine résumé-derived personalization line. Never lorem, never mail-merge placeholders (a generic line kills the anti-spam promise).
5. **Honest trust markers only.** No fake "trusted by" logo cloud (we're pre-traction). Use principle-based trust: *no auto-apply · no scraping · you approve every send.*
6. **Accessibility AA, always.** ≥4.5:1 text contrast; visible focus; `prefers-reduced-motion` fully honored; keyboard-complete.
7. **Ships on the existing stack.** Next.js 14 + Tailwind + shadcn/ui, fonts already installed: **Geist Sans + Geist Mono** (`next/font/local`). Any premium display face is a *progressive enhancement*, never a launch blocker (see Section 5). Fast: CLS < 0.1, no heavy 3D/bloom.
8. **Light-first, with a true dark "Night Edition."** Design both together.

---

## 4. Art direction — PRIMARY: **"Morning Edition"**

> A broadsheet front page for your career. Swiss-grid restraint and oversized grotesque type frame every outreach email as one carefully edited *dispatch*, timed to land on the recruiter's desk at first light.

**The idea.** The whole page is composed like the front page of a beautifully-set newspaper — because "edited, authored, deliberate" *is* our positioning. Editorial authority = the anti-spam argument, made visually.

**Mood.** Composed, exacting, quietly confident. A well-set masthead meets a Swiss rail timetable. Precise, literate, spacious, honest, *expensive-quiet*. It should feel authored by a person with taste, not generated by a tool.

**The signature interaction — the Timezone Rail.** A single hairline ruler spans the hero, drawn like a Swiss timetable with tick marks and three city labels (e.g. `SAN FRANCISCO · LONDON · BENGALURU`). On load, **one** accent dot glides *once* along the rail and rests precisely on each city's **9:00 AM** band, while a mono caption ticks to `SCHEDULED — LANDS 9:00 AM LOCAL`. It never loops. This one honest, ownable element *demonstrates* "lands in their morning" — no floating-screenshot cliché required. **This is the page's soul; make it exquisite.**

**The hero artifact — "The Dispatch."** Beside/beneath the headline, render **one** real recruiter email as a newspaper column: a real `From: you@yourdomain.com` header (hammering *your own inbox*), a byline (the recruiter/company), and a body whose **one résumé-derived personalization line is set in the accent color** so the eye lands on the human detail, not a mail-merge. A mono "system-truth" status line reads `SCHEDULED — LANDS 9:00 AM LOCAL` with tabular numerals. *One perfect artifact doing one honest thing.*

**Grafts (folded in from the exploration panel — use these):**
- **A single self-typing beat:** the personalization line may type itself in once (~2s, then rest) to show "warmed by who you are." Respect reduced-motion (render finished instantly).
- **Editorial trust dateline** instead of check-bullets: a hairline rule reading `NO AUTO-APPLY · NO SCRAPING · YOU APPROVE EVERY SEND`.
- **"Approved by you" ink-stamp** as the send-confirmation motif (a restrained editorial stamp, not a green checkmark).
- **Exactly one moment of warmth:** a very soft, single-use dawn glow (~5–6% opacity) behind the artifact — rationed, never ambient.

---

## 5. Design system

*Concrete starting values. Tune to taste, but keep the discipline.*

### Typography
- **Ship on:** **Geist Sans** (display + body) and **Geist Mono** (labels/timestamps/rail) — already in the repo.
- **Progressive enhancement (optional, non-blocking):** swap display to **Söhne** (Klim) or **PP Neue Montreal** if licensed. For a serif accent (wordmark / one pull-quote only), use **free Fraunces** — do **not** gate launch on paid faces (GT Sectra/Lyon/Söhne).
- **"Big text" treatment:** hero `clamp(3.5rem, 8.5vw, 7.5rem)`, **weight 500**, tracking `-0.03em`, line-height `0.95`, **left-aligned**, hanging punctuation. Headlines are 2–5 words; let 3–4 empty columns sit beside them.
- **Type scale (px):** Display 56–120 · H2 32–44 · H3 22–26 · Deck/lede 20–22 (weight 400, LH 1.5) · Body 17–18 (LH 1.65) · Label/mono 12–13 uppercase, tracking `+0.12em`.
- **Numerals:** **tabular / mono everywhere a time appears** (9:00 AM, timestamps, counts). Never proportional figures on times.

### Color — Light ("Morning Edition")
| Role | Value | Notes |
|---|---|---|
| Paper (bg) | `#F6F5F1` | warm newsprint — **never** pure `#fff` |
| Ink (text) | `#141414` | ~16:1 on paper |
| Hairline | `#E3E1DB` | rules, dividers, grid |
| Caption grey | `#6B6B64` | secondary text (verify AA per size) |
| **Accent — Sunrise Vermilion** | `#EB4A27` | the gliding dot, primary button, one headline word, link underlines |
| Accent (link text) | `#C23A1E` | darkened to clear AA (≥4.5:1) on paper |

### Color — Dark ("Night Edition", true inversion)
| Role | Value |
|---|---|
| Paper (bg) | `#0C0C0C` |
| Ink (text) | `#EDEBE6` |
| Accent | `#EB4A27` (sings on black) |

**Accent discipline:** vermilion stays **≤ ~5% of surface** — one word, one dot, one button, link underlines. That rarity is what makes it read premium.
**Token action:** replace the current slate/zinc shadcn tokens (240-hue) with these warm newsprint tokens, or the premium intent won't survive the default theme.

### Spacing & grid
- **8px baseline** everywhere. **12-column** grid, content capped ~**1240px**, wide confident outer margins.
- **Asymmetric, single left axis.** Editorial composition: kicker → oversized headline → deck → column. Faint hairline column/baseline rules may be *shown* (Swiss/structural — refined, not brutalist costume).
- **Generous section rhythm:** 128–160px vertical breaks (up to ~200px for statement moments). **Whitespace is the primary material.**
- **Mobile:** collapse to one strong column; rules become full-bleed dividers; hero type never drops below ~2.75rem.

### Motion (editorial restraint)
- Headlines **clip/mask-reveal upward** (as if printed), ~500ms `cubic-bezier(0.16,1,0.3,1)`, staggered by line.
- Hairlines **draw in** (`scaleX 0→1`) as sections enter.
- **The one cinematic beat:** the rail dot's single authored glide + settle on load. Nothing loops.
- Link hover: accent underline **wipes** left→right (~180ms). Buttons: subtle fill shift; press scale 0.98.
- **`prefers-reduced-motion`:** all reveals collapse to a 1-opacity fade; the dot renders statically parked at 9:00 AM; the demo email shows finished; underlines appear without the wipe. The page is 100% legible and complete with zero motion.

### Iconography & imagery
- Line icons only (Lucide, ~1.5px stroke) — **or better, editorial numerals** (`01 / 02 / 03`) for steps. **No AI-sparkle icons.**
- **No stock photos, no illustrations of people, no floating browser mockups.** The artifact email + the rail *are* the imagery.

---

## 6. Section-by-section (the *what*, not a rigid *how*)

*For each: what it must communicate + hierarchy. Composition is yours.*

1. **Top bar** — quiet wordmark (left) + 2–3 nav links + one primary CTA (`Start free`). Hairline underline on scroll. No heavy shadow.
2. **Hero — "The Dispatch"** — the whole argument in one screen: oversized left-aligned headline (one word in accent), a one-line deck, the **Timezone Rail**, the **artifact email** (real `From:` header + accent personalization line + mono `SCHEDULED` status), primary CTA, and the editorial trust dateline. This is 80% of the job — spend 80% of the craft here.
3. **The shift (problem→insight)** — a single confident editorial statement + 2–3 tabular figures (11,000 apps/min; recruiters lose ½ a week to spam; 1 great email > 100 into the void). Restraint; no infographic clutter.
4. **How it works** — four numbered *dispatches* (`01` upload résumé · `02` we draft, you approve · `03` send from your inbox, timed · `04` follow up & track). Editorial, hairline-separated.
5. **Features** — smart timing · your own inbox · personalized by AI · follow-ups · application tracker · private by design. Terse, gridded, one line each. No card-shadow soup.
6. **Why it works** — quality vs mass-applying, stated with editorial authority (a restrained two-column or a single pull-quote in the serif accent). The honest differentiator.
7. **FAQ** — the trust questions answered plainly (spam? Gmail safety? where do emails come from? password? free?). Accessible disclosure (native `<details>` is fine).
8. **Final CTA** — one confident line + `Start free`; the **"Approved by you" ink-stamp** motif can close the argument.
9. **Footer** — wordmark, minimal links, honest one-line tagline, copyright. Quiet.

---

## 7. Premium references (study these)

- **Linear** (linear.app) — restraint, type, dark craft.
- **Vercel** (vercel.com) — grid, mono labels, monochrome + accent.
- **Stripe** — Stripe Press & docs — editorial authority, trust.
- **Klim Type Foundry** (klim.co.nz) — how big grotesque type breathes.
- **Bloomberg Businessweek** — editorial/broadsheet composition.
- **Arc** (arc.net), **Family / Instrument**-style studio sites — expressive-but-clean type as interface.

Use these for *taste calibration*, not to copy. Our signature (the Timezone Rail + the Dispatch artifact) is ours alone.

---

## 8. Anti-patterns — the kill-list (do NOT do these)

Several of these exist on the *current* page; killing them is half the job.

- ❌ **Indigo→violet gradient blur blob** behind the hero (the #1 growth-starter cliché).
- ❌ Dashed / low-opacity **grid overlay** fading to background.
- ❌ Rounded-full **pill badge with a gradient dot** ("For job seekers who…").
- ❌ **Emerald check-bullet** trust markers → use editorial hairline datelines instead.
- ❌ **Floating product screenshot** in rounded browser chrome + `shadow-2xl` → replace with the page-IS-the-product artifact.
- ❌ **Centered** hero text → editorial big type is **left-aligned**, intentionally ragged.
- ❌ **Black / 900-weight** display (weight ≠ confidence; use 500).
- ❌ **AI-sparkle** iconography, glow, bloom, chromatic aberration, aurora washes as ambient decoration.
- ❌ **Lorem / mail-merge** placeholder in the demo email (must be a real résumé-derived sentence).
- ❌ **Overusing the accent** (vermilion stays ≤ ~5% of surface).
- ❌ Pure `#fff` / pure `#000` (use warm newsprint paper + warm ink).
- ❌ **Fake "trusted by" logo cloud** for a pre-traction product (dishonest).
- ❌ **Gradient CTA buttons** (use solid ink or the single accent).
- ❌ **Over-cooked newspaper costume** — no fake barcodes, halftone photos, or heavy skeuomorphic newsprint texture. Keep it Swiss/structural; restraint over pastiche.
- ❌ **Gating launch on paid fonts** — that's how "premium" quietly becomes "unshipped."

---

## 9. Sanctioned explorations (your creative room)

The panel produced strong alternates. You're **encouraged to explore** within the guardrails — bring us the Morning Edition primary plus, if inspired, one of these:

- **Exploration B — "First Light" (warm/human):** oat-paper warmth, **free Fraunces** serif, a self-typing letter that visibly weaves a real résumé line. More *human*; risk = it can tip toward "boutique writer's blog," so keep the enterprise rigor. Its typing demo is a crown jewel worth borrowing regardless.
- **Exploration C — "Night Edition" (dark-native, cinematic):** the deep near-black cockpit, **one** dawn-arrival beat. Gorgeous, but easy to over-decorate — if you go here, strip glow/grain/aurora to near-zero and keep it an *instrument*, not a light show. Best used as our **dark mode**, not the default.

Surprise us — but every experiment must still pass Section 3 and avoid Section 8.

---

## 10. Deliverables & handoff

- **Figma** (organized, named layers, auto-layout, components).
- **Artboards:** Desktop **1440**, Tablet **768**, Mobile **375** — for **every** section.
- **Both themes:** Light "Morning Edition" + Dark "Night Edition."
- **All states:** default / hover / focus-visible / pressed / disabled; plus the `prefers-reduced-motion` variant of the hero.
- **Motion spec:** a short doc or Figma prototype of the **Timezone Rail** beat + section reveals (durations, easings, triggers).
- **Design tokens:** color / type / spacing / radius / motion as a table **and** as CSS variables mapped to the app's shadcn token names (so engineering can drop them into `globals.css`). Include the warm-newsprint replacements for the current 240-hue tokens.
- **Type & spacing scales** documented (the values in Section 5, finalized).
- **Accessibility annotations:** contrast pairs verified, focus order, alt/aria intent, reduced-motion behavior.
- **Asset export:** SVG for the rail, wordmark, ink-stamp; no rasters where vector will do.
- **Constraints reminder:** buildable in Next.js + Tailwind + shadcn; ships on Geist; CLS < 0.1; WCAG AA.

**What "done" looks like:** a design-literate engineer lands on it and thinks *"…okay, these people have taste"* before they've read a sentence — and understands, in one screen, that this sends one perfect email from their inbox at the perfect time.

---

## 11. Creative latitude (fixed vs. free)

| **Fixed (don't touch)** | **Free (make it yours)** |
|---|---|
| Positioning: quality-over-quantity, honest, no-spam | Exact hero composition & rag |
| Differentiators shown: own inbox · smart timing · you approve | The visual form of the Timezone Rail |
| Restraint, big-type-by-weight-500, left-aligned, whitespace | Secondary section layouts |
| The page-IS-the-product (real artifact, real résumé line) | Micro-interactions & the reveal choreography |
| WCAG AA · reduced-motion · ships on Geist · fast | Warm (B) or dark (C) explorations |
| No Section-8 clichés | Wordmark, ink-stamp, and editorial furniture |

---

## 12. The creative prompt (paste this to a designer or an AI design tool)

> **Design a premium, enterprise-grade landing page for "LeadsTenet"** — a job-hunt cockpit that turns your résumé into *personalized* emails to recruiters, sent from **your own inbox**, timed to land in **their morning** (plus job discovery, follow-ups, tracking). Audience: design-literate AI/tech professionals who distrust growth-hack tools; for them, **restraint = trust**.
>
> **Style:** Swiss-editorial minimalism — a beautifully-set broadsheet. **Newsprint white `#F6F5F1`, ink `#141414`, and ONE rationed warm accent, Sunrise Vermilion `#EB4A27` (≤5% of surface).** Big confident type **by restraint, not weight**: display `clamp(3.5rem, 8.5vw, 7.5rem)`, weight **500**, tracking `-0.03em`, line-height `0.95`, **left-aligned**. Fonts: **Geist Sans + Geist Mono** (mono, uppercase, tracked, for all labels/timestamps; tabular numerals on every time). Optional serif accent: **Fraunces**, used twice max. 12-col grid, ~1240px, 8px baseline, **half-empty viewports**, 128–160px section rhythm, asymmetric single-left-axis composition, visible hairline rules.
>
> **Hero (spend 80% of the craft here):** the page IS the product. Left: an oversized 3-line headline with **one** word in vermilion. A **Timezone Rail** — a hairline Swiss-timetable ruler with 3 city labels (`SAN FRANCISCO · LONDON · BENGALURU`); on load, a single vermilion dot **glides once** and rests on each city's **9:00 AM** band with a mono caption `SCHEDULED — LANDS 9:00 AM LOCAL`. Beside it, **one real email artifact** with a genuine `From: you@yourdomain.com` header and **one résumé-derived personalization line set in vermilion** (never lorem). Trust dateline: `NO AUTO-APPLY · NO SCRAPING · YOU APPROVE EVERY SEND`. One primary CTA: `Start free`.
>
> **Sections:** hero → editorial problem/insight (tabular stats) → how-it-works (numbered `01–04` dispatches) → features (terse grid) → why-it-works (quality vs mass-applying) → FAQ → final CTA with an **"Approved by you" ink-stamp** → quiet footer.
>
> **Motion:** editorial restraint; the rail dot is the ONE cinematic beat; clip-reveal headlines; underline-wipe links; honor `prefers-reduced-motion` fully.
>
> **Deliver:** light + dark ("Night Edition"), desktop/tablet/mobile, all states, tokens.
>
> **Do NOT:** gradient blob, dashed grid overlay, gradient-dot pill badge, emerald check bullets, floating screenshot in browser chrome, centered hero, 900-black type, AI-sparkle icons, glow/aurora/bloom, fake logo cloud, gradient buttons, pure #fff/#000, lorem in the demo, over-cooked newspaper costume. **References:** Linear, Vercel, Stripe Press, Klim Type Foundry, Bloomberg Businessweek.

---

*Once the visual direction is signed off, engineering can implement it on the existing Next.js + Tailwind + shadcn stack — the token table (Section 10) drops straight into the theme.*
