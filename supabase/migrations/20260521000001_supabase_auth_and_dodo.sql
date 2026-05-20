-- ============================================================================
-- Migration: Move from Clerk auth to Supabase Auth, re-enable RLS, swap
--            Stripe billing columns for Dodo Payments.
-- Date: 2026-05-21
--
-- WHAT THIS DOES
--  * Repoints public.users.id to auth.users(id) (Supabase Auth is the identity).
--  * Drops the Clerk coupling (users.clerk_user_id, requesting_user_id() JWT sub).
--  * Rewrites EVERY RLS policy to use auth.uid() and RE-ENABLES RLS on all
--    tables (the previous migration left RLS DISABLED — a critical hole).
--  * Auto-provisions a public.users row on signup via a trigger.
--  * Replaces stripe_customer_id with dodo_customer_id / dodo_subscription_id.
--
-- ⚠️  DESTRUCTIVE: existing public.users rows are tied to Clerk identities that
--     cannot map to auth.users, so they (and their campaigns/leads via cascade)
--     are cleared. Intended for a fresh/dev database. Back up first if needed.
-- ============================================================================

-- 0. Drop ALL existing RLS policies (several reference clerk_user_id).
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 1. Drop views / functions that reference clerk_user_id.
DROP VIEW IF EXISTS public.user_dashboard_stats CASCADE;
DROP VIEW IF EXISTS public.campaign_performance CASCADE;
DROP FUNCTION IF EXISTS public.get_user_by_clerk_id(text);

-- 2. Reset Clerk-linked application data (dev reset).
TRUNCATE public.users CASCADE;

-- 3. Repoint users to Supabase Auth + swap billing columns.
ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;
DROP INDEX IF EXISTS public.idx_users_clerk_user_id;
ALTER TABLE public.users DROP COLUMN IF EXISTS clerk_user_id;
ALTER TABLE public.users DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS dodo_customer_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS dodo_subscription_id TEXT;

-- Align the free-tier column defaults with the app's plan catalog (lib/plans.ts).
ALTER TABLE public.users ALTER COLUMN emails_per_month SET DEFAULT 100;
ALTER TABLE public.users ALTER COLUMN campaigns_limit SET DEFAULT 5;
ALTER TABLE public.users ALTER COLUMN leads_per_upload SET DEFAULT 500;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.users
  ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3b. email_logs may record send failures; allow 'failed' in the status check.
ALTER TABLE public.email_logs DROP CONSTRAINT IF EXISTS email_logs_status_check;
ALTER TABLE public.email_logs ADD CONSTRAINT email_logs_status_check
  CHECK (status IN ('queued','sent','delivered','bounced','complained','opened','clicked','failed'));

-- 4. requesting_user_id() now returns the Supabase auth uid.
DROP FUNCTION IF EXISTS public.requesting_user_id();
CREATE OR REPLACE FUNCTION public.requesting_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$ SELECT auth.uid() $$;

-- 5. Auto-provision a profile row when an auth user is created.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Re-enable RLS on every table.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- 7. Policies keyed on auth.uid() (= public.users.id).

-- users: a user can read/insert/update only their own row.
CREATE POLICY "users_self_select" ON public.users
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "users_self_insert" ON public.users
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "users_self_update" ON public.users
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- campaigns: owned by the user directly.
CREATE POLICY "campaigns_owner_all" ON public.campaigns
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- leads: scoped through the owning campaign.
CREATE POLICY "leads_owner_all" ON public.leads
  FOR ALL TO authenticated
  USING (campaign_id IN (SELECT id FROM public.campaigns WHERE user_id = auth.uid()))
  WITH CHECK (campaign_id IN (SELECT id FROM public.campaigns WHERE user_id = auth.uid()));

-- email_logs: scoped through the owning campaign.
CREATE POLICY "email_logs_owner_all" ON public.email_logs
  FOR ALL TO authenticated
  USING (campaign_id IN (SELECT id FROM public.campaigns WHERE user_id = auth.uid()))
  WITH CHECK (campaign_id IN (SELECT id FROM public.campaigns WHERE user_id = auth.uid()));

-- usage_logs: owned by the user (inserts also happen via SECURITY DEFINER RPC).
CREATE POLICY "usage_logs_owner_all" ON public.usage_logs
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ai_content: scoped through lead -> campaign -> user.
CREATE POLICY "ai_content_owner_all" ON public.ai_content
  FOR ALL TO authenticated
  USING (lead_id IN (
    SELECT l.id FROM public.leads l
    JOIN public.campaigns c ON l.campaign_id = c.id
    WHERE c.user_id = auth.uid()
  ))
  WITH CHECK (lead_id IN (
    SELECT l.id FROM public.leads l
    JOIN public.campaigns c ON l.campaign_id = c.id
    WHERE c.user_id = auth.uid()
  ));

-- user_domains: owned by the user directly.
CREATE POLICY "user_domains_owner_all" ON public.user_domains
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- subscription_plans: public read of active plans only.
CREATE POLICY "subscription_plans_public_read" ON public.subscription_plans
  FOR SELECT TO anon, authenticated USING (active = true);

-- 8. Recreate views as security_invoker so they respect the caller's RLS.
CREATE VIEW public.user_dashboard_stats
WITH (security_invoker = on) AS
SELECT
  u.id AS user_id,
  u.subscription_tier,
  u.full_name,
  u.email,
  COUNT(DISTINCT c.id) AS total_campaigns,
  COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) AS active_campaigns,
  COUNT(DISTINCT CASE WHEN c.status = 'completed' THEN c.id END) AS completed_campaigns,
  COUNT(DISTINCT l.id) AS total_leads,
  COUNT(DISTINCT CASE WHEN l.status = 'sent' THEN l.id END) AS leads_contacted,
  COUNT(DISTINCT CASE
    WHEN el.sent_at >= DATE_TRUNC('month', CURRENT_DATE) THEN el.id
  END) AS emails_this_month,
  u.emails_per_month AS email_limit,
  u.campaigns_limit AS campaign_limit,
  u.leads_per_upload AS upload_limit,
  MAX(c.updated_at) AS last_campaign_activity
FROM public.users u
LEFT JOIN public.campaigns c ON u.id = c.user_id
LEFT JOIN public.leads l ON c.id = l.campaign_id
LEFT JOIN public.email_logs el ON l.id = el.lead_id
GROUP BY u.id, u.subscription_tier, u.full_name, u.email,
         u.emails_per_month, u.campaigns_limit, u.leads_per_upload;

CREATE VIEW public.campaign_performance
WITH (security_invoker = on) AS
SELECT
  c.*,
  u.id AS owner_id,
  COUNT(DISTINCT l.id) AS lead_count,
  COUNT(DISTINCT CASE WHEN l.status = 'processed' THEN l.id END) AS processed_count,
  COUNT(DISTINCT el.id) AS emails_sent_count,
  COUNT(DISTINCT CASE WHEN el.status = 'delivered' THEN el.id END) AS delivered_count,
  COUNT(DISTINCT CASE WHEN el.status = 'opened' THEN el.id END) AS opened_count,
  COUNT(DISTINCT CASE WHEN el.status = 'clicked' THEN el.id END) AS clicked_count,
  COUNT(DISTINCT CASE WHEN el.status IN ('bounced', 'complained') THEN el.id END) AS failed_count
FROM public.campaigns c
JOIN public.users u ON c.user_id = u.id
LEFT JOIN public.leads l ON c.id = l.campaign_id
LEFT JOIN public.email_logs el ON l.id = el.lead_id
GROUP BY c.id, u.id;

-- 9. Tighten privileges: deny anon to user-data tables; allow authenticated
--    (RLS still constrains rows). subscription_plans stays publicly readable.
REVOKE ALL ON public.users, public.campaigns, public.leads, public.email_logs,
  public.usage_logs, public.ai_content, public.user_domains FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.users, public.campaigns,
  public.leads, public.email_logs, public.usage_logs, public.ai_content,
  public.user_domains TO authenticated;

GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT SELECT ON public.user_dashboard_stats, public.campaign_performance TO authenticated;

-- Done.
SELECT 'Supabase Auth + Dodo migration applied; RLS re-enabled' AS status;
