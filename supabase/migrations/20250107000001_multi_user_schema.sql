-- LeadsTeNet Multi-User Database Schema
-- This migration creates the complete multi-user structure while preserving existing functionality

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_claims_user_id" = '';

-- Users table (integrates with Clerk)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    company_name TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due')),
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Subscription limits
    emails_per_month INTEGER DEFAULT 50,
    campaigns_limit INTEGER DEFAULT 3,
    leads_per_upload INTEGER DEFAULT 100,
    
    -- Settings
    email_signature TEXT,
    default_from_email TEXT,
    default_from_name TEXT,
    timezone TEXT DEFAULT 'UTC'
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);

-- Campaigns table (user-specific lead generation campaigns)
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
    
    -- Campaign settings
    from_email TEXT,
    from_name TEXT,
    reply_to_email TEXT,
    
    -- AI settings
    ai_model TEXT DEFAULT 'gemini-1.5-flash',
    email_tone TEXT DEFAULT 'professional',
    
    -- Statistics
    total_leads INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    emails_delivered INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    emails_failed INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sent_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);

-- Leads table (campaign-specific contact data)
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    
    -- Core lead data
    name TEXT,
    email TEXT NOT NULL,
    company TEXT,
    industry TEXT,
    
    -- Additional data from Excel (flexible JSON storage)
    additional_data JSONB DEFAULT '{}',
    
    -- Processing status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'sent', 'failed', 'bounced')),
    ai_confidence INTEGER, -- AI confidence score 0-100
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    last_contacted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for leads
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_additional_data ON leads USING gin(additional_data);

-- Email logs table (detailed email tracking)
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    
    -- Email content
    subject TEXT NOT NULL,
    body_html TEXT,
    body_text TEXT,
    
    -- Email metadata
    from_email TEXT NOT NULL,
    to_email TEXT NOT NULL,
    reply_to_email TEXT,
    message_id TEXT, -- External provider message ID
    
    -- Status tracking
    status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'bounced', 'complained', 'opened', 'clicked')),
    error_message TEXT,
    
    -- Provider data
    provider TEXT DEFAULT 'resend',
    provider_response JSONB,
    
    -- Timestamps
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for email logs
CREATE INDEX IF NOT EXISTS idx_email_logs_lead_id ON email_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id ON email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);

-- Usage tracking table (for billing and limits)
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Usage type
    action TEXT NOT NULL CHECK (action IN ('email_sent', 'ai_processed', 'lead_uploaded', 'campaign_created')),
    count INTEGER DEFAULT 1,
    
    -- Context
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    
    -- Temporal data
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for usage logs
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON usage_logs(action);
CREATE INDEX IF NOT EXISTS idx_usage_logs_date ON usage_logs(date DESC);

-- AI generated content table (cache AI responses)
CREATE TABLE IF NOT EXISTS ai_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    
    -- Generated content
    email_subject TEXT,
    email_body TEXT,
    linkedin_message TEXT,
    twitter_message TEXT,
    
    -- AI metadata
    ai_model TEXT NOT NULL,
    confidence_score INTEGER, -- 0-100
    tone TEXT,
    call_to_action TEXT,
    
    -- Processing info
    prompt_hash TEXT, -- Hash of the prompt used (for caching)
    tokens_used INTEGER,
    processing_time_ms INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for AI content
CREATE INDEX IF NOT EXISTS idx_ai_content_lead_id ON ai_content(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_prompt_hash ON ai_content(prompt_hash);

-- Subscription plans reference table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly INTEGER, -- in cents
    price_yearly INTEGER,  -- in cents
    
    -- Limits
    emails_per_month INTEGER,
    campaigns_limit INTEGER,
    leads_per_upload INTEGER,
    ai_requests_per_month INTEGER,
    
    -- Features
    features JSONB DEFAULT '[]',
    
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, description, price_monthly, price_yearly, emails_per_month, campaigns_limit, leads_per_upload, ai_requests_per_month, features) VALUES
('free', 'Free', 'Perfect for getting started', 0, 0, 50, 3, 100, 150, '["Basic email templates", "Excel upload", "AI personalization"]'),
('pro', 'Pro', 'Best for growing businesses', 4900, 49000, 1000, 20, 500, 3000, '["Advanced templates", "Campaign analytics", "Priority support", "A/B testing"]'),
('enterprise', 'Enterprise', 'For large organizations', 14900, 149000, 5000, -1, 1000, 10000, '["Custom domains", "API access", "Team collaboration", "Advanced analytics", "Dedicated support"]')
ON CONFLICT (id) DO NOTHING;

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_content ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (clerk_user_id = public.requesting_user_id());
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (clerk_user_id = public.requesting_user_id());
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (clerk_user_id = public.requesting_user_id());

-- Campaigns table policies
CREATE POLICY "Users can manage own campaigns" ON campaigns FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE clerk_user_id = public.requesting_user_id())
);

-- Leads table policies
CREATE POLICY "Users can manage own leads" ON leads FOR ALL USING (
    campaign_id IN (
        SELECT c.id FROM campaigns c 
        JOIN users u ON c.user_id = u.id 
        WHERE u.clerk_user_id = public.requesting_user_id()
    )
);

-- Email logs table policies
CREATE POLICY "Users can view own email logs" ON email_logs FOR SELECT USING (
    campaign_id IN (
        SELECT c.id FROM campaigns c 
        JOIN users u ON c.user_id = u.id 
        WHERE u.clerk_user_id = public.requesting_user_id()
    )
);

CREATE POLICY "System can insert email logs" ON email_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update email logs" ON email_logs FOR UPDATE USING (true);

-- Usage logs table policies
CREATE POLICY "Users can view own usage" ON usage_logs FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE clerk_user_id = public.requesting_user_id())
);

CREATE POLICY "System can insert usage logs" ON usage_logs FOR INSERT WITH CHECK (true);

-- AI content table policies
CREATE POLICY "Users can manage own AI content" ON ai_content FOR ALL USING (
    lead_id IN (
        SELECT l.id FROM leads l
        JOIN campaigns c ON l.campaign_id = c.id
        JOIN users u ON c.user_id = u.id
        WHERE u.clerk_user_id = public.requesting_user_id()
    )
);

-- Subscription plans table (public read)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read subscription plans" ON subscription_plans FOR SELECT USING (active = true);

-- Functions for common operations

-- Function to get user by Clerk ID
CREATE OR REPLACE FUNCTION get_user_by_clerk_id(clerk_id TEXT)
RETURNS users
LANGUAGE sql
STABLE
AS $$
    SELECT * FROM users WHERE clerk_user_id = clerk_id LIMIT 1;
$$;

-- Function to check user usage limits
CREATE OR REPLACE FUNCTION check_user_limit(
    p_user_id UUID,
    p_action TEXT,
    p_period TEXT DEFAULT 'monthly'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    current_usage INTEGER;
    user_limit INTEGER;
    start_date DATE;
BEGIN
    -- Determine the period start date
    IF p_period = 'monthly' THEN
        start_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    ELSIF p_period = 'daily' THEN
        start_date := CURRENT_DATE;
    ELSE
        start_date := CURRENT_DATE - INTERVAL '1 year';
    END IF;

    -- Get current usage
    SELECT COALESCE(SUM(count), 0) INTO current_usage
    FROM usage_logs
    WHERE user_id = p_user_id
        AND action = p_action
        AND date >= start_date;

    -- Get user limit based on subscription
    SELECT 
        CASE p_action
            WHEN 'email_sent' THEN u.emails_per_month
            WHEN 'ai_processed' THEN sp.ai_requests_per_month
            ELSE 999999 -- No limit for other actions
        END INTO user_limit
    FROM users u
    LEFT JOIN subscription_plans sp ON u.subscription_tier = sp.id
    WHERE u.id = p_user_id;

    -- Return true if under limit
    RETURN current_usage < user_limit;
END;
$$;

-- Function to record usage
CREATE OR REPLACE FUNCTION record_usage(
    p_user_id UUID,
    p_action TEXT,
    p_count INTEGER DEFAULT 1,
    p_campaign_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO usage_logs (user_id, action, count, campaign_id)
    VALUES (p_user_id, p_action, p_count, p_campaign_id)
    ON CONFLICT DO NOTHING;
END;
$$;

-- Function to update campaign statistics
CREATE OR REPLACE FUNCTION update_campaign_stats(p_campaign_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE campaigns SET
        total_leads = (SELECT COUNT(*) FROM leads WHERE campaign_id = p_campaign_id),
        emails_sent = (SELECT COUNT(*) FROM email_logs WHERE campaign_id = p_campaign_id AND status = 'sent'),
        emails_delivered = (SELECT COUNT(*) FROM email_logs WHERE campaign_id = p_campaign_id AND status = 'delivered'),
        emails_opened = (SELECT COUNT(*) FROM email_logs WHERE campaign_id = p_campaign_id AND status = 'opened'),
        emails_clicked = (SELECT COUNT(*) FROM email_logs WHERE campaign_id = p_campaign_id AND status = 'clicked'),
        emails_failed = (SELECT COUNT(*) FROM email_logs WHERE campaign_id = p_campaign_id AND status IN ('bounced', 'complained')),
        updated_at = NOW()
    WHERE id = p_campaign_id;
END;
$$;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create views for common queries

-- User dashboard view
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
    u.id as user_id,
    u.clerk_user_id,
    u.subscription_tier,
    
    -- Campaign stats
    COUNT(DISTINCT c.id) as total_campaigns,
    COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_campaigns,
    
    -- Lead stats
    COUNT(DISTINCT l.id) as total_leads,
    COUNT(DISTINCT CASE WHEN l.status = 'sent' THEN l.id END) as leads_contacted,
    
    -- Email stats this month
    COUNT(DISTINCT CASE WHEN el.sent_at >= DATE_TRUNC('month', CURRENT_DATE) THEN el.id END) as emails_this_month,
    
    -- Usage limits
    u.emails_per_month as email_limit,
    u.campaigns_limit as campaign_limit
    
FROM users u
LEFT JOIN campaigns c ON u.id = c.user_id
LEFT JOIN leads l ON c.id = l.campaign_id
LEFT JOIN email_logs el ON l.id = el.lead_id
GROUP BY u.id, u.clerk_user_id, u.subscription_tier, u.emails_per_month, u.campaigns_limit;

-- Campaign performance view
CREATE OR REPLACE VIEW campaign_performance AS
SELECT 
    c.*,
    COUNT(DISTINCT l.id) as lead_count,
    COUNT(DISTINCT el.id) as emails_sent_count,
    COUNT(DISTINCT CASE WHEN el.status = 'delivered' THEN el.id END) as delivered_count,
    COUNT(DISTINCT CASE WHEN el.status = 'opened' THEN el.id END) as opened_count,
    COUNT(DISTINCT CASE WHEN el.status = 'clicked' THEN el.id END) as clicked_count,
    
    -- Calculate rates
    CASE WHEN COUNT(DISTINCT el.id) > 0 THEN
        ROUND(COUNT(DISTINCT CASE WHEN el.status = 'delivered' THEN el.id END) * 100.0 / COUNT(DISTINCT el.id), 2)
    ELSE 0 END as delivery_rate,
    
    CASE WHEN COUNT(DISTINCT CASE WHEN el.status = 'delivered' THEN el.id END) > 0 THEN
        ROUND(COUNT(DISTINCT CASE WHEN el.status = 'opened' THEN el.id END) * 100.0 / COUNT(DISTINCT CASE WHEN el.status = 'delivered' THEN el.id END), 2)
    ELSE 0 END as open_rate,
    
    CASE WHEN COUNT(DISTINCT CASE WHEN el.status = 'opened' THEN el.id END) > 0 THEN
        ROUND(COUNT(DISTINCT CASE WHEN el.status = 'clicked' THEN el.id END) * 100.0 / COUNT(DISTINCT CASE WHEN el.status = 'opened' THEN el.id END), 2)
    ELSE 0 END as click_rate
    
FROM campaigns c
LEFT JOIN leads l ON c.id = l.campaign_id
LEFT JOIN email_logs el ON l.id = el.lead_id
GROUP BY c.id;