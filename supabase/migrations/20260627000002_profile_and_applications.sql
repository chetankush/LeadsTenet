-- ============================================================================
-- Migration: Job-search profile/goals + application tracker.
-- Date: 2026-06-27
--
--  * users.outreach_profile (jsonb): the user's goals & preferences (target
--    roles, salary, target companies, locations, weekly target) + their saved
--    platforms-per-country list. Editable under the existing users RLS policies.
--  * outreach_applications: a tracker of where the user applied — company, role,
--    platform, region/country, pipeline status, link, notes, dates. RLS-scoped.
--
-- Safe to run repeatedly (IF NOT EXISTS).
-- ============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS outreach_profile jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.outreach_applications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company    text NOT NULL DEFAULT '',
  role       text NOT NULL DEFAULT '',
  platform   text NOT NULL DEFAULT '',
  region     text NOT NULL DEFAULT 'other',
  status     text NOT NULL DEFAULT 'applied' CHECK (status IN (
               'saved', 'applied', 'interviewing', 'offer', 'rejected', 'ghosted'
             )),
  job_url    text,
  notes      text,
  applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_applications_user_created
  ON public.outreach_applications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_applications_user_platform
  ON public.outreach_applications (user_id, platform);

ALTER TABLE public.outreach_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "outreach_applications_owner_all" ON public.outreach_applications;
CREATE POLICY "outreach_applications_owner_all" ON public.outreach_applications
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

REVOKE ALL ON public.outreach_applications FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_applications TO authenticated;

SELECT 'Profile + applications tables ready; RLS enabled' AS status;
