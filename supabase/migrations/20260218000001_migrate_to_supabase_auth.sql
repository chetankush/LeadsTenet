-- Migration: Clerk Auth → Supabase Auth
-- Renames clerk_user_id to auth_user_id in the users table
-- Updates RLS policies to use auth.uid() instead of Clerk JWT

-- Step 1: Rename the column
ALTER TABLE users RENAME COLUMN clerk_user_id TO auth_user_id;

-- Step 2: Update or recreate the requesting_user_id() function
-- This function is used by RLS policies to get the current user's ID
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT AS $$
  SELECT auth.uid()::text;
$$ LANGUAGE SQL STABLE;

-- Step 3: Drop existing RLS policies that reference clerk_user_id or old JWT format
-- (Policies may or may not exist - use IF EXISTS pattern)

-- Users table policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Campaigns table policies
DROP POLICY IF EXISTS "Users can view own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can create own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can update own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can delete own campaigns" ON campaigns;

-- Leads table policies
DROP POLICY IF EXISTS "Users can view leads in own campaigns" ON leads;
DROP POLICY IF EXISTS "Users can create leads in own campaigns" ON leads;
DROP POLICY IF EXISTS "Users can update leads in own campaigns" ON leads;

-- Email logs table policies
DROP POLICY IF EXISTS "Users can view own email logs" ON email_logs;
DROP POLICY IF EXISTS "Users can create email logs" ON email_logs;

-- Usage logs table policies
DROP POLICY IF EXISTS "Users can view own usage" ON usage_logs;

-- Step 4: Recreate RLS policies using auth.uid()

-- Users table
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth_user_id = auth.uid()::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth_user_id = auth.uid()::text);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth_user_id = auth.uid()::text);

-- Campaigns table
CREATE POLICY "Users can view own campaigns" ON campaigns
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()::text)
  );

CREATE POLICY "Users can create own campaigns" ON campaigns
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()::text)
  );

CREATE POLICY "Users can update own campaigns" ON campaigns
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()::text)
  );

CREATE POLICY "Users can delete own campaigns" ON campaigns
  FOR DELETE USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()::text)
  );

-- Leads table
CREATE POLICY "Users can view leads in own campaigns" ON leads
  FOR SELECT USING (
    campaign_id IN (
      SELECT c.id FROM campaigns c
      JOIN users u ON c.user_id = u.id
      WHERE u.auth_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can create leads in own campaigns" ON leads
  FOR INSERT WITH CHECK (
    campaign_id IN (
      SELECT c.id FROM campaigns c
      JOIN users u ON c.user_id = u.id
      WHERE u.auth_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update leads in own campaigns" ON leads
  FOR UPDATE USING (
    campaign_id IN (
      SELECT c.id FROM campaigns c
      JOIN users u ON c.user_id = u.id
      WHERE u.auth_user_id = auth.uid()::text
    )
  );

-- Email logs table
CREATE POLICY "Users can view own email logs" ON email_logs
  FOR SELECT USING (
    campaign_id IN (
      SELECT c.id FROM campaigns c
      JOIN users u ON c.user_id = u.id
      WHERE u.auth_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can create email logs" ON email_logs
  FOR INSERT WITH CHECK (
    campaign_id IN (
      SELECT c.id FROM campaigns c
      JOIN users u ON c.user_id = u.id
      WHERE u.auth_user_id = auth.uid()::text
    )
  );

-- Usage logs table
CREATE POLICY "Users can view own usage" ON usage_logs
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()::text)
  );

-- Note: RLS is currently disabled on all tables (per fix_rls_policies migration).
-- When you're ready to enable RLS, run:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
