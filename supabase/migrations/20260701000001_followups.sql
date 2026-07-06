-- ============================================================================
-- Migration: Follow-up tracking on sent outreach emails.
-- Date: 2026-07-01
--
-- Adds follow-up bookkeeping to outreach_sends so we can surface which emails
-- are due for a polite nudge (no reply, sent a while ago, under the cap) and
-- record when a follow-up goes out. Additive + idempotent.
-- ============================================================================

ALTER TABLE public.outreach_sends
  ADD COLUMN IF NOT EXISTS followups_sent integer NOT NULL DEFAULT 0;
ALTER TABLE public.outreach_sends
  ADD COLUMN IF NOT EXISTS last_followup_at timestamptz;

SELECT 'Follow-up columns added to outreach_sends' AS status;
