-- Enable Row Level Security on all tables
-- RLS policies already exist from migrate_to_supabase_auth migration, just need to activate them

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing service role policies if they exist (idempotent)
DROP POLICY IF EXISTS "Service role full access on users" ON users;
DROP POLICY IF EXISTS "Service role full access on campaigns" ON campaigns;
DROP POLICY IF EXISTS "Service role full access on leads" ON leads;
DROP POLICY IF EXISTS "Service role full access on email_logs" ON email_logs;
DROP POLICY IF EXISTS "Service role full access on usage_logs" ON usage_logs;
DROP POLICY IF EXISTS "Users can insert own usage" ON usage_logs;

-- Allow service role to bypass RLS (needed for server-side API routes using service role key)
-- Service role already bypasses RLS by default in Supabase, but adding explicit policies for safety

CREATE POLICY "Service role full access on users" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on campaigns" ON campaigns
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on leads" ON leads
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on email_logs" ON email_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on usage_logs" ON usage_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can insert own usage" ON usage_logs
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()::text)
  );

-- Enable RLS on template-related tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'email_templates') THEN
    EXECUTE 'ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Service role full access on email_templates" ON email_templates';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view active templates" ON email_templates';
    EXECUTE 'CREATE POLICY "Service role full access on email_templates" ON email_templates FOR ALL USING (auth.role() = ''service_role'')';
    EXECUTE 'CREATE POLICY "Users can view active templates" ON email_templates FOR SELECT USING (status = ''active'' OR created_by IN (SELECT id FROM users WHERE auth_user_id = auth.uid()::text))';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_template_cart') THEN
    EXECUTE 'ALTER TABLE user_template_cart ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Service role full access on user_template_cart" ON user_template_cart';
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage own cart" ON user_template_cart';
    EXECUTE 'CREATE POLICY "Service role full access on user_template_cart" ON user_template_cart FOR ALL USING (auth.role() = ''service_role'')';
    EXECUTE 'CREATE POLICY "Users can manage own cart" ON user_template_cart FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()::text))';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_domains') THEN
    EXECUTE 'ALTER TABLE user_domains ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Service role full access on user_domains" ON user_domains';
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage own domains" ON user_domains';
    EXECUTE 'CREATE POLICY "Service role full access on user_domains" ON user_domains FOR ALL USING (auth.role() = ''service_role'')';
    EXECUTE 'CREATE POLICY "Users can manage own domains" ON user_domains FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()::text))';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'campaign_templates') THEN
    EXECUTE 'ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Service role full access on campaign_templates" ON campaign_templates';
    EXECUTE 'CREATE POLICY "Service role full access on campaign_templates" ON campaign_templates FOR ALL USING (auth.role() = ''service_role'')';
  END IF;
END $$;
