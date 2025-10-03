-- Add user domains table for domain verification feature
-- Migration: User domains for custom email sending
-- Date: 2025-09-21

-- User domains table (for custom domain verification)
CREATE TABLE IF NOT EXISTS public.user_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Domain details
    domain_name TEXT NOT NULL,
    resend_domain_id TEXT, -- ID from Resend API

    -- Verification status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
    verification_error TEXT,

    -- DNS records for verification
    dns_records JSONB DEFAULT '[]',

    -- Domain settings
    is_default BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    last_verified_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_domains_user_id ON public.user_domains(user_id);
CREATE INDEX IF NOT EXISTS idx_user_domains_domain_name ON public.user_domains(domain_name);
CREATE INDEX IF NOT EXISTS idx_user_domains_status ON public.user_domains(status);
CREATE INDEX IF NOT EXISTS idx_user_domains_resend_domain_id ON public.user_domains(resend_domain_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_domains_unique_domain ON public.user_domains(domain_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_domains_unique_resend_id ON public.user_domains(resend_domain_id) WHERE resend_domain_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.user_domains ENABLE ROW LEVEL SECURITY;

-- RLS Policy for user domains
DROP POLICY IF EXISTS "Users can manage own domains" ON public.user_domains;
CREATE POLICY "Users can manage own domains" ON public.user_domains FOR ALL
USING (user_id IN (SELECT id FROM public.users WHERE clerk_user_id = public.requesting_user_id()));

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_user_domains_updated_at ON public.user_domains;
CREATE TRIGGER update_user_domains_updated_at
    BEFORE UPDATE ON public.user_domains
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to ensure only one default domain per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_domain()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- If setting a domain as default, unset all other defaults for this user
    IF NEW.is_default = true THEN
        UPDATE public.user_domains
        SET is_default = false, updated_at = NOW()
        WHERE user_id = NEW.user_id
        AND id != NEW.id
        AND is_default = true;
    END IF;

    RETURN NEW;
END;
$$;

-- Add trigger to ensure single default domain
DROP TRIGGER IF EXISTS ensure_single_default_domain_trigger ON public.user_domains;
CREATE TRIGGER ensure_single_default_domain_trigger
    BEFORE INSERT OR UPDATE ON public.user_domains
    FOR EACH ROW
    WHEN (NEW.is_default = true)
    EXECUTE FUNCTION public.ensure_single_default_domain();

-- Function to get user's default domain
CREATE OR REPLACE FUNCTION public.get_user_default_domain(p_user_id UUID)
RETURNS public.user_domains
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT * FROM public.user_domains
    WHERE user_id = p_user_id
    AND is_default = true
    AND status = 'verified'
    LIMIT 1;
$$;

-- Function to check domain limits based on subscription
CREATE OR REPLACE FUNCTION public.check_domain_limit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    current_domains INTEGER;
    user_tier TEXT;
    max_domains INTEGER;
BEGIN
    -- Get current domain count
    SELECT COUNT(*) INTO current_domains
    FROM public.user_domains
    WHERE user_id = p_user_id;

    -- Get user's subscription tier
    SELECT subscription_tier INTO user_tier
    FROM public.users
    WHERE id = p_user_id;

    -- Set domain limits based on tier
    CASE user_tier
        WHEN 'free' THEN max_domains := 1;
        WHEN 'pro' THEN max_domains := 5;
        WHEN 'enterprise' THEN max_domains := -1; -- unlimited
        ELSE max_domains := 1;
    END CASE;

    -- Return true if under limit (or unlimited)
    RETURN max_domains = -1 OR current_domains < max_domains;
END;
$$;

-- Grant permissions
GRANT ALL ON public.user_domains TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_single_default_domain() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_default_domain(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_domain_limit(UUID) TO anon, authenticated;

-- Migration completed
SELECT 'User domains table created successfully' as status;