-- LeadsTeNet Complete Database Schema (Fresh Setup for Supabase Auth)
-- Run this in Supabase Dashboard → SQL Editor for a new project

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to get the requesting user id from Supabase Auth
CREATE OR REPLACE FUNCTION public.requesting_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid()::text;
$$;

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table (integrates with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id TEXT UNIQUE NOT NULL,
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

    -- User settings (JSON blob for flexible settings storage)
    settings JSONB DEFAULT '{}',

    -- Legacy fields kept for compatibility
    email_signature TEXT,
    default_from_email TEXT,
    default_from_name TEXT,
    timezone TEXT DEFAULT 'UTC',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
    from_email TEXT,
    from_name TEXT,
    reply_to_email TEXT,
    ai_model TEXT DEFAULT 'gemini-2.0-flash',
    email_tone TEXT DEFAULT 'professional',
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

-- Leads table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT NOT NULL,
    company TEXT,
    industry TEXT,
    additional_data JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'sent', 'failed', 'bounced')),
    ai_confidence INTEGER CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    last_contacted_at TIMESTAMP WITH TIME ZONE
);

-- Email logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    body_html TEXT,
    body_text TEXT,
    from_email TEXT NOT NULL,
    to_email TEXT NOT NULL,
    reply_to_email TEXT,
    message_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'bounced', 'complained', 'opened', 'clicked')),
    error_message TEXT,
    provider TEXT DEFAULT 'resend',
    provider_response JSONB DEFAULT '{}',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('email_sent', 'ai_processed', 'lead_uploaded', 'campaign_created')),
    count INTEGER DEFAULT 1,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI content cache table
CREATE TABLE IF NOT EXISTS public.ai_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    email_subject TEXT,
    email_body TEXT,
    linkedin_message TEXT,
    twitter_message TEXT,
    ai_model TEXT NOT NULL,
    confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
    tone TEXT,
    call_to_action TEXT,
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
    price_monthly INTEGER,
    price_yearly INTEGER,
    emails_per_month INTEGER,
    campaigns_limit INTEGER,
    leads_per_upload INTEGER,
    ai_requests_per_month INTEGER,
    features JSONB DEFAULT '[]',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DOMAIN MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    domain_name TEXT NOT NULL,
    resend_domain_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
    verification_error TEXT,
    dns_records JSONB DEFAULT '[]',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    last_verified_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- EMAIL TEMPLATES
-- ============================================

CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    subject_template TEXT,
    is_system BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    mood_tags TEXT[] DEFAULT '{}',
    custom_tags TEXT[] DEFAULT '{}',
    scenario TEXT,
    usage_count INTEGER DEFAULT 0,
    variables JSONB DEFAULT '{}',
    preview_text TEXT,
    thumbnail_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_template_cart (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
    folder_name TEXT,
    is_favorite BOOLEAN DEFAULT false,
    custom_notes TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, template_id)
);

CREATE TABLE IF NOT EXISTS public.campaign_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES public.users(id),
    variant_name TEXT,
    split_percentage INTEGER DEFAULT 100 CHECK (split_percentage >= 0 AND split_percentage <= 100),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(campaign_id, template_id, variant_name)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
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
CREATE INDEX IF NOT EXISTS idx_user_domains_user_id ON public.user_domains(user_id);
CREATE INDEX IF NOT EXISTS idx_user_domains_domain_name ON public.user_domains(domain_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_domains_unique_domain ON public.user_domains(domain_name);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON public.email_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_templates_status ON public.email_templates(status);
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON public.user_template_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_templates_campaign ON public.campaign_templates(campaign_id);

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO public.subscription_plans (id, name, description, price_monthly, price_yearly, emails_per_month, campaigns_limit, leads_per_upload, ai_requests_per_month, features) VALUES
('free', 'Free', 'Perfect for getting started', 0, 0, 100, 5, 500, 300, '["Basic email templates", "Excel upload", "AI personalization"]'),
('pro', 'Pro', 'Best for growing businesses', 4900, 49000, 2000, 50, 2000, 6000, '["Advanced templates", "Campaign analytics", "Priority support", "A/B testing"]'),
('enterprise', 'Enterprise', 'For large organizations', 14900, 149000, 10000, -1, 5000, 20000, '["Custom domains", "API access", "Team collaboration", "Advanced analytics", "Dedicated support"]')
ON CONFLICT (id) DO NOTHING;

-- Insert 10 system email templates
INSERT INTO public.email_templates (name, description, content, subject_template, is_system, mood_tags, scenario, preview_text, variables) VALUES
('Professional Introduction', 'A formal introduction email for new business contacts',
'Hi {{recipientName}},

I''m {{senderName}} from {{companyName}}. I came across {{recipientCompany}} and was impressed by your work in the {{industry}} industry.

We specialize in helping companies like yours {{valueProposition}}. I''d love to explore how we might work together.

Would you be open to a brief call next week?

Best regards,
{{senderName}}
{{senderTitle}}
{{companyName}}',
'Introduction from {{companyName}}', true, ARRAY['professional', 'formal'], 'Professional Introduction', 'Formal introduction for new business contacts...', '{}'::jsonb),

('Friendly Follow-up', 'A warm follow-up email after initial contact',
'Hey {{recipientName}},

Hope you''re doing well! I wanted to follow up on our conversation about {{topic}}.

No pressure at all - just wanted to keep the conversation going. Let me know if you''d like to chat more!

Cheers,
{{senderName}}',
'Following up - {{topic}}', true, ARRAY['friendly', 'casual', 'warm'], 'Friendly Follow-up', 'Warm follow-up after initial conversation...', '{}'::jsonb),

('Sales Pitch', 'A persuasive sales email highlighting benefits',
'Hi {{recipientName}},

I noticed {{recipientCompany}} is in {{industry}}, and I thought you might be interested in how we''ve helped similar companies.

Would you be interested in a quick 15-minute demo?

Best,
{{senderName}}
{{companyName}}',
'How {{companyName}} can help {{recipientCompany}}', true, ARRAY['professional', 'persuasive'], 'Sales Pitch', 'Persuasive pitch highlighting key benefits...', '{}'::jsonb),

('Meeting Request', 'Request a meeting or call with prospects',
'Hi {{recipientName}},

I''d love to schedule a brief call to discuss {{topic}}.

Does any time this week work for you?

Looking forward to connecting!
{{senderName}}
{{companyName}}',
'Meeting request: {{topic}}', true, ARRAY['professional', 'friendly'], 'Meeting Request', 'Schedule meetings with prospects...', '{}'::jsonb),

('Thank You Note', 'Express gratitude to clients or partners',
'Hi {{recipientName}},

I wanted to take a moment to say thank you for {{reason}}.

It''s been a pleasure working with {{recipientCompany}}.

Best wishes,
{{senderName}}
{{companyName}}',
'Thank you, {{recipientName}}!', true, ARRAY['warm', 'friendly'], 'Thank You Note', 'Express gratitude and appreciation...', '{}'::jsonb);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_template_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_templates ENABLE ROW LEVEL SECURITY;

-- Users: can only access their own data
CREATE POLICY "Users can read own data" ON public.users FOR SELECT
USING (auth_user_id = auth.uid()::text);

CREATE POLICY "Users can update own data" ON public.users FOR UPDATE
USING (auth_user_id = auth.uid()::text);

CREATE POLICY "Users can insert own data" ON public.users FOR INSERT
WITH CHECK (auth_user_id = auth.uid()::text);

-- Service role full access to users (for server-side operations)
CREATE POLICY "Service role full access to users" ON public.users FOR ALL
USING (auth.role() = 'service_role');

-- Campaigns
CREATE POLICY "Users can manage own campaigns" ON public.campaigns FOR ALL
USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()::text));

CREATE POLICY "Service role full access to campaigns" ON public.campaigns FOR ALL
USING (auth.role() = 'service_role');

-- Leads
CREATE POLICY "Users can manage own leads" ON public.leads FOR ALL
USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.users u ON c.user_id = u.id
    WHERE u.auth_user_id = auth.uid()::text
));

CREATE POLICY "Service role full access to leads" ON public.leads FOR ALL
USING (auth.role() = 'service_role');

-- Email logs
CREATE POLICY "Users can view own email logs" ON public.email_logs FOR SELECT
USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.users u ON c.user_id = u.id
    WHERE u.auth_user_id = auth.uid()::text
));

CREATE POLICY "Service role full access to email_logs" ON public.email_logs FOR ALL
USING (auth.role() = 'service_role');

-- Usage logs
CREATE POLICY "Users can view own usage" ON public.usage_logs FOR SELECT
USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()::text));

CREATE POLICY "Service role full access to usage_logs" ON public.usage_logs FOR ALL
USING (auth.role() = 'service_role');

-- AI content
CREATE POLICY "Users can manage own AI content" ON public.ai_content FOR ALL
USING (lead_id IN (
    SELECT l.id FROM public.leads l
    JOIN public.campaigns c ON l.campaign_id = c.id
    JOIN public.users u ON c.user_id = u.id
    WHERE u.auth_user_id = auth.uid()::text
));

CREATE POLICY "Service role full access to ai_content" ON public.ai_content FOR ALL
USING (auth.role() = 'service_role');

-- Subscription plans: public read
CREATE POLICY "Anyone can read subscription plans" ON public.subscription_plans FOR SELECT
USING (active = true);

-- User domains
CREATE POLICY "Users can manage own domains" ON public.user_domains FOR ALL
USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()::text));

CREATE POLICY "Service role full access to user_domains" ON public.user_domains FOR ALL
USING (auth.role() = 'service_role');

-- Email templates
CREATE POLICY "Anyone can view system templates" ON public.email_templates FOR SELECT
USING (is_system = true OR created_by IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()::text
));

CREATE POLICY "Users can create custom templates" ON public.email_templates FOR INSERT
WITH CHECK (created_by IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()::text
));

CREATE POLICY "Users can update own templates" ON public.email_templates FOR UPDATE
USING (created_by IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()::text
));

CREATE POLICY "Users can delete own templates" ON public.email_templates FOR DELETE
USING (created_by IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()::text
));

CREATE POLICY "Service role full access to email_templates" ON public.email_templates FOR ALL
USING (auth.role() = 'service_role');

-- User template cart
CREATE POLICY "Users can manage own cart" ON public.user_template_cart FOR ALL
USING (user_id IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()::text
));

CREATE POLICY "Service role full access to user_template_cart" ON public.user_template_cart FOR ALL
USING (auth.role() = 'service_role');

-- Campaign templates
CREATE POLICY "Users can manage campaign templates" ON public.campaign_templates FOR ALL
USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.users u ON c.user_id = u.id
    WHERE u.auth_user_id = auth.uid()::text
));

CREATE POLICY "Service role full access to campaign_templates" ON public.campaign_templates FOR ALL
USING (auth.role() = 'service_role');

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_domains_updated_at ON public.user_domains;
CREATE TRIGGER update_user_domains_updated_at
    BEFORE UPDATE ON public.user_domains
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Domain default enforcement
CREATE OR REPLACE FUNCTION public.ensure_single_default_domain()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE public.user_domains
        SET is_default = false, updated_at = NOW()
        WHERE user_id = NEW.user_id AND id != NEW.id AND is_default = true;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_single_default_domain_trigger ON public.user_domains;
CREATE TRIGGER ensure_single_default_domain_trigger
    BEFORE INSERT OR UPDATE ON public.user_domains
    FOR EACH ROW WHEN (NEW.is_default = true)
    EXECUTE FUNCTION public.ensure_single_default_domain();

-- Template usage counter
CREATE OR REPLACE FUNCTION increment_template_usage(p_template_id UUID)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    UPDATE public.email_templates SET usage_count = usage_count + 1 WHERE id = p_template_id;
END;
$$;

-- ============================================
-- PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

SELECT 'LeadsTeNet database setup completed successfully!' as status;
