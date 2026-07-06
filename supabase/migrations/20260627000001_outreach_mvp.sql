-- ============================================================================
-- Migration: Outreach MVP — durable send records + analytics events.
-- Date: 2026-06-27
--
-- Powers the recruiter-outreach product's validation metrics (emails sent,
-- reply rate, activation funnel) and reply tracking. Working state (profile,
-- targets, drafts) lives client-side for snappiness; only durable, cross-device
-- signal lands here. Both tables are RLS-scoped to auth.uid(), matching the
-- patterns in 20260521000001_supabase_auth_and_dodo.sql.
--
-- Safe to run repeatedly (IF NOT EXISTS). Application writes to these tables are
-- best-effort, so the app keeps working until this migration is applied.
-- ============================================================================

-- 1. Durable record of each email actually sent from the user's own inbox.
CREATE TABLE IF NOT EXISTS public.outreach_sends (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company    text NOT NULL DEFAULT '',
  role       text NOT NULL DEFAULT '',
  to_email   text NOT NULL,
  subject    text NOT NULL DEFAULT '',
  region     text NOT NULL DEFAULT 'other',
  message_id text,
  sent_at    timestamptz NOT NULL DEFAULT now(),
  replied_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_outreach_sends_user_sent
  ON public.outreach_sends (user_id, sent_at DESC);

-- 2. Append-only analytics events for the activation funnel + intent signals.
CREATE TABLE IF NOT EXISTS public.outreach_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text NOT NULL CHECK (type IN (
               'resume_uploaded', 'generated', 'sent', 'marked_replied', 'pro_intent'
             )),
  metadata   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_events_user_created
  ON public.outreach_events (user_id, created_at DESC);

-- 3. RLS — each user sees and writes only their own rows.
ALTER TABLE public.outreach_sends  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "outreach_sends_owner_all" ON public.outreach_sends;
CREATE POLICY "outreach_sends_owner_all" ON public.outreach_sends
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "outreach_events_owner_all" ON public.outreach_events;
CREATE POLICY "outreach_events_owner_all" ON public.outreach_events
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Privileges: deny anon, allow authenticated (RLS still constrains rows).
REVOKE ALL ON public.outreach_sends, public.outreach_events FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.outreach_sends, public.outreach_events TO authenticated;

SELECT 'Outreach MVP tables created; RLS enabled' AS status;
