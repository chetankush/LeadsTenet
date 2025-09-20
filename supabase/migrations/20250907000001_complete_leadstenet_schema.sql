-- LeadsTeNet Complete Database Schema
-- Migration: Complete multi-user schema with working RLS policies
-- Date: 2025-09-07

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to get the requesting user id from Clerk JWT
-- This function extracts the user ID from the Clerk JWT token
CREATE OR REPLACE FUNCTION public.requesting_user_id() 
RETURNS text 
LANGUAGE sql 
STABLE 
AS $function$
SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json ->> 'sub',
    ''
)::text;
$function$;

-- Users table (integrates with Clerk authentication)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    company_name TEXT,
    
    -- Subscription management
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due')),
    stripe_customer_id TEXT,
    
    -- Subscription limits
    emails_per_month INTEGER DEFAULT 100,
    campaigns_limit INTEGER DEFAULT 5,
    leads_per_upload INTEGER DEFAULT 500,
    
    -- User settings
    email_signature TEXT,
    default_from_email TEXT,
    default_from_name TEXT,
    timezone TEXT DEFAULT 'UTC',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Campaigns table (user's email campaigns)
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Campaign details
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
    
    -- Email configuration
    from_email TEXT,
    from_name TEXT,
    reply_to_email TEXT,
    
    -- AI settings
    ai_model TEXT DEFAULT 'gemini-1.5-flash',
    email_tone TEXT DEFAULT 'professional',
    
    -- Campaign statistics
    total_leads INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    emails_delivered INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    emails_failed INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sent_at TIMESTAMP WITH TIME ZONE
);

-- Leads table (contact information for campaigns)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    
    -- Lead contact information
    name TEXT,
    email TEXT NOT NULL,
    company TEXT,
    industry TEXT,
    
    -- Additional data from Excel uploads (stored as JSON)
    additional_data JSONB DEFAULT '{}',
    
    -- Processing status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'sent', 'failed', 'bounced')),
    ai_confidence INTEGER CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    last_contacted_at TIMESTAMP WITH TIME ZONE
);

-- Email logs table (detailed email sending history)
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    
    -- Email content
    subject TEXT NOT NULL,
    body_html TEXT,
    body_text TEXT,
    
    -- Email addresses
    from_email TEXT NOT NULL,
    to_email TEXT NOT NULL,
    reply_to_email TEXT,
    
    -- External tracking
    message_id TEXT, -- Resend/provider message ID
    
    -- Status tracking
    status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'bounced', 'complained', 'opened', 'clicked')),
    error_message TEXT,
    
    -- Provider information
    provider TEXT DEFAULT 'resend',
    provider_response JSONB DEFAULT '{}',
    
    -- Timestamps
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE
);

-- Usage tracking table (for billing and analytics)
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Usage details
    action TEXT NOT NULL CHECK (action IN ('email_sent', 'ai_processed', 'lead_uploaded', 'campaign_created')),
    count INTEGER DEFAULT 1,
    
    -- Context
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    
    -- Temporal tracking
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI content cache table (store AI generated content)
CREATE TABLE IF NOT EXISTS public.ai_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    
    -- Generated content
    email_subject TEXT,
    email_body TEXT,
    linkedin_message TEXT,
    twitter_message TEXT,
    
    -- AI metadata
    ai_model TEXT NOT NULL,
    confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
    tone TEXT,
    call_to_action TEXT,
    
    -- Processing information
    prompt_hash TEXT,
    tokens_used INTEGER,
    processing_time_ms INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription plans reference table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    
    -- Pricing (in cents)
    price_monthly INTEGER,
    price_yearly INTEGER,
    
    -- Feature limits
    emails_per_month INTEGER,
    campaigns_limit INTEGER,
    leads_per_upload INTEGER,
    ai_requests_per_month INTEGER,
    
    -- Features array
    features JSONB DEFAULT '[]',
    
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON public.users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON public.users(subscription_tier);

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.campaigns(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON public.leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_additional_data ON public.leads USING gin(additional_data);

CREATE INDEX IF NOT EXISTS idx_email_logs_lead_id ON public.email_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id ON public.email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON public.usage_logs(action);
CREATE INDEX IF NOT EXISTS idx_usage_logs_date ON public.usage_logs(date DESC);

CREATE INDEX IF NOT EXISTS idx_ai_content_lead_id ON public.ai_content(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_prompt_hash ON public.ai_content(prompt_hash);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (id, name, description, price_monthly, price_yearly, emails_per_month, campaigns_limit, leads_per_upload, ai_requests_per_month, features) VALUES
('free', 'Free', 'Perfect for getting started', 0, 0, 100, 5, 500, 300, '["Basic email templates", "Excel upload", "AI personalization"]'),
('pro', 'Pro', 'Best for growing businesses', 4900, 49000, 2000, 50, 2000, 6000, '["Advanced templates", "Campaign analytics", "Priority support", "A/B testing"]'),
('enterprise', 'Enterprise', 'For large organizations', 14900, 149000, 10000, -1, 5000, 20000, '["Custom domains", "API access", "Team collaboration", "Advanced analytics", "Dedicated support"]')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    emails_per_month = EXCLUDED.emails_per_month,
    campaigns_limit = EXCLUDED.campaigns_limit,
    leads_per_upload = EXCLUDED.leads_per_upload,
    ai_requests_per_month = EXCLUDED.ai_requests_per_month,
    features = EXCLUDED.features;

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: can only access their own data
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

CREATE POLICY "Users can read own data" ON public.users FOR SELECT 
USING (clerk_user_id = public.requesting_user_id());

CREATE POLICY "Users can update own data" ON public.users FOR UPDATE 
USING (clerk_user_id = public.requesting_user_id());

CREATE POLICY "Users can insert own data" ON public.users FOR INSERT 
WITH CHECK (clerk_user_id = public.requesting_user_id());

-- Campaigns: users can only access their own campaigns
DROP POLICY IF EXISTS "Users can manage own campaigns" ON public.campaigns;
CREATE POLICY "Users can manage own campaigns" ON public.campaigns FOR ALL 
USING (user_id IN (SELECT id FROM public.users WHERE clerk_user_id = public.requesting_user_id()));

-- Leads: users can only access leads from their campaigns
DROP POLICY IF EXISTS "Users can manage own leads" ON public.leads;
CREATE POLICY "Users can manage own leads" ON public.leads FOR ALL 
USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c 
    JOIN public.users u ON c.user_id = u.id 
    WHERE u.clerk_user_id = public.requesting_user_id()
));

-- Email logs: users can view their email logs, system can insert/update
DROP POLICY IF EXISTS "Users can view own email logs" ON public.email_logs;
DROP POLICY IF EXISTS "System can insert email logs" ON public.email_logs;
DROP POLICY IF EXISTS "System can update email logs" ON public.email_logs;

CREATE POLICY "Users can view own email logs" ON public.email_logs FOR SELECT 
USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c 
    JOIN public.users u ON c.user_id = u.id 
    WHERE u.clerk_user_id = public.requesting_user_id()
));

CREATE POLICY "System can insert email logs" ON public.email_logs FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update email logs" ON public.email_logs FOR UPDATE 
USING (true);

-- Usage logs: users can view their own usage, system can insert
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_logs;
DROP POLICY IF EXISTS "System can insert usage logs" ON public.usage_logs;

CREATE POLICY "Users can view own usage" ON public.usage_logs FOR SELECT 
USING (user_id IN (SELECT id FROM public.users WHERE clerk_user_id = public.requesting_user_id()));

CREATE POLICY "System can insert usage logs" ON public.usage_logs FOR INSERT 
WITH CHECK (true);

-- AI content: users can manage their AI content
DROP POLICY IF EXISTS "Users can manage own AI content" ON public.ai_content;
CREATE POLICY "Users can manage own AI content" ON public.ai_content FOR ALL 
USING (lead_id IN (
    SELECT l.id FROM public.leads l
    JOIN public.campaigns c ON l.campaign_id = c.id
    JOIN public.users u ON c.user_id = u.id
    WHERE u.clerk_user_id = public.requesting_user_id()
));

-- Subscription plans: public read access for active plans
DROP POLICY IF EXISTS "Anyone can read subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can read subscription plans" ON public.subscription_plans FOR SELECT 
USING (active = true);

-- Utility Functions

-- Function to get user by Clerk ID
CREATE OR REPLACE FUNCTION public.get_user_by_clerk_id(clerk_id TEXT)
RETURNS public.users
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT * FROM public.users WHERE clerk_user_id = clerk_id LIMIT 1;
$$;

-- Function to check if user can perform action based on subscription limits
CREATE OR REPLACE FUNCTION public.check_user_limit(
    p_user_id UUID,
    p_action TEXT,
    p_period TEXT DEFAULT 'monthly'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    current_usage INTEGER;
    user_limit INTEGER;
    start_date DATE;
BEGIN
    -- Determine period start date
    IF p_period = 'monthly' THEN
        start_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    ELSIF p_period = 'daily' THEN
        start_date := CURRENT_DATE;
    ELSE
        start_date := CURRENT_DATE - INTERVAL '1 year';
    END IF;

    -- Get current usage for the period
    SELECT COALESCE(SUM(count), 0) INTO current_usage
    FROM public.usage_logs
    WHERE user_id = p_user_id
        AND action = p_action
        AND date >= start_date;

    -- Get user's limit based on subscription
    SELECT 
        CASE p_action
            WHEN 'email_sent' THEN u.emails_per_month
            WHEN 'campaign_created' THEN u.campaigns_limit
            WHEN 'ai_processed' THEN sp.ai_requests_per_month
            ELSE 999999
        END INTO user_limit
    FROM public.users u
    LEFT JOIN public.subscription_plans sp ON u.subscription_tier = sp.id
    WHERE u.id = p_user_id;

    -- Return true if under limit (or unlimited)
    RETURN COALESCE(user_limit, 999999) = -1 OR current_usage < COALESCE(user_limit, 999999);
END;
$$;

-- Function to record usage
CREATE OR REPLACE FUNCTION public.record_usage(
    p_user_id UUID,
    p_action TEXT,
    p_count INTEGER DEFAULT 1,
    p_campaign_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.usage_logs (user_id, action, count, campaign_id)
    VALUES (p_user_id, p_action, p_count, p_campaign_id)
    ON CONFLICT DO NOTHING;
EXCEPTION WHEN OTHERS THEN
    -- Silently fail to avoid breaking the main flow
    NULL;
END;
$$;

-- Function to update campaign statistics
CREATE OR REPLACE FUNCTION public.update_campaign_stats(p_campaign_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.campaigns SET
        total_leads = (SELECT COUNT(*) FROM public.leads WHERE campaign_id = p_campaign_id),
        emails_sent = (SELECT COUNT(*) FROM public.email_logs WHERE campaign_id = p_campaign_id AND status IN ('sent', 'delivered', 'opened', 'clicked')),
        emails_delivered = (SELECT COUNT(*) FROM public.email_logs WHERE campaign_id = p_campaign_id AND status IN ('delivered', 'opened', 'clicked')),
        emails_opened = (SELECT COUNT(*) FROM public.email_logs WHERE campaign_id = p_campaign_id AND status IN ('opened', 'clicked')),
        emails_clicked = (SELECT COUNT(*) FROM public.email_logs WHERE campaign_id = p_campaign_id AND status = 'clicked'),
        emails_failed = (SELECT COUNT(*) FROM public.email_logs WHERE campaign_id = p_campaign_id AND status IN ('bounced', 'complained')),
        updated_at = NOW()
    WHERE id = p_campaign_id;
END;
$$;

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Add update triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON public.campaigns;

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at 
    BEFORE UPDATE ON public.campaigns 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create useful views

-- User dashboard statistics view
CREATE OR REPLACE VIEW public.user_dashboard_stats AS
SELECT 
    u.id as user_id,
    u.clerk_user_id,
    u.subscription_tier,
    u.full_name,
    u.email,
    
    -- Campaign statistics
    COUNT(DISTINCT c.id) as total_campaigns,
    COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_campaigns,
    COUNT(DISTINCT CASE WHEN c.status = 'completed' THEN c.id END) as completed_campaigns,
    
    -- Lead statistics
    COUNT(DISTINCT l.id) as total_leads,
    COUNT(DISTINCT CASE WHEN l.status = 'sent' THEN l.id END) as leads_contacted,
    
    -- Email statistics (this month)
    COUNT(DISTINCT CASE 
        WHEN el.sent_at >= DATE_TRUNC('month', CURRENT_DATE) 
        THEN el.id 
    END) as emails_this_month,
    
    -- Usage limits
    u.emails_per_month as email_limit,
    u.campaigns_limit as campaign_limit,
    u.leads_per_upload as upload_limit,
    
    -- Last activity
    MAX(c.updated_at) as last_campaign_activity
    
FROM public.users u
LEFT JOIN public.campaigns c ON u.id = c.user_id
LEFT JOIN public.leads l ON c.id = l.campaign_id
LEFT JOIN public.email_logs el ON l.id = el.lead_id
GROUP BY u.id, u.clerk_user_id, u.subscription_tier, u.full_name, u.email, u.emails_per_month, u.campaigns_limit, u.leads_per_upload;

-- Campaign performance view
CREATE OR REPLACE VIEW public.campaign_performance AS
SELECT 
    c.*,
    u.clerk_user_id as owner_clerk_id,
    
    -- Lead counts
    COUNT(DISTINCT l.id) as lead_count,
    COUNT(DISTINCT CASE WHEN l.status = 'processed' THEN l.id END) as processed_count,
    
    -- Email counts
    COUNT(DISTINCT el.id) as emails_sent_count,
    COUNT(DISTINCT CASE WHEN el.status = 'delivered' THEN el.id END) as delivered_count,
    COUNT(DISTINCT CASE WHEN el.status = 'opened' THEN el.id END) as opened_count,
    COUNT(DISTINCT CASE WHEN el.status = 'clicked' THEN el.id END) as clicked_count,
    COUNT(DISTINCT CASE WHEN el.status IN ('bounced', 'complained') THEN el.id END) as failed_count,
    
    -- Performance rates
    CASE 
        WHEN COUNT(DISTINCT el.id) > 0 THEN
            ROUND(COUNT(DISTINCT CASE WHEN el.status = 'delivered' THEN el.id END) * 100.0 / COUNT(DISTINCT el.id), 2)
        ELSE 0 
    END as delivery_rate,
    
    CASE 
        WHEN COUNT(DISTINCT CASE WHEN el.status = 'delivered' THEN el.id END) > 0 THEN
            ROUND(COUNT(DISTINCT CASE WHEN el.status = 'opened' THEN el.id END) * 100.0 / COUNT(DISTINCT CASE WHEN el.status = 'delivered' THEN el.id END), 2)
        ELSE 0 
    END as open_rate,
    
    CASE 
        WHEN COUNT(DISTINCT CASE WHEN el.status = 'opened' THEN el.id END) > 0 THEN
            ROUND(COUNT(DISTINCT CASE WHEN el.status = 'clicked' THEN el.id END) * 100.0 / COUNT(DISTINCT CASE WHEN el.status = 'opened' THEN el.id END), 2)
        ELSE 0 
    END as click_rate
    
FROM public.campaigns c
JOIN public.users u ON c.user_id = u.id
LEFT JOIN public.leads l ON c.id = l.campaign_id
LEFT JOIN public.email_logs el ON l.id = el.lead_id
GROUP BY c.id, c.user_id, c.name, c.description, c.status, c.from_email, c.from_name, c.reply_to_email, c.ai_model, c.email_tone, c.total_leads, c.emails_sent, c.emails_delivered, c.emails_opened, c.emails_clicked, c.emails_failed, c.created_at, c.updated_at, c.last_sent_at, u.clerk_user_id;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Migration completed successfully
SELECT 'LeadsTeNet database schema migration completed successfully' as status;