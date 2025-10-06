-- Email Template Management System
-- Migration: Add email templates, user carts, and template assignments

-- Email Templates Table (Pre-built and Custom)
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Template Info
    name TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    subject_template TEXT,

    -- Template Type
    is_system BOOLEAN DEFAULT false, -- true for pre-built, false for custom
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE, -- null for system templates

    -- Categorization
    mood_tags TEXT[] DEFAULT '{}', -- e.g., ['professional', 'friendly']
    custom_tags TEXT[] DEFAULT '{}',
    scenario TEXT, -- e.g., 'Professional Introduction', 'Sales Pitch'

    -- Usage Stats
    usage_count INTEGER DEFAULT 0,

    -- Template Variables/Placeholders
    variables JSONB DEFAULT '{}', -- Track available variables like {{name}}, {{company}}

    -- Metadata
    preview_text TEXT, -- Short preview for cards
    thumbnail_url TEXT, -- Optional template preview image

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Template Cart (Favorites/Saved Templates)
CREATE TABLE IF NOT EXISTS public.user_template_cart (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,

    -- Organization
    folder_name TEXT,
    is_favorite BOOLEAN DEFAULT false,
    custom_notes TEXT,

    -- Timestamps
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint: user can't add same template twice
    UNIQUE(user_id, template_id)
);

-- Campaign Template Assignments
CREATE TABLE IF NOT EXISTS public.campaign_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,

    -- Assignment Info
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES public.users(id),

    -- A/B Testing Support
    variant_name TEXT, -- 'A', 'B', 'C', etc.
    split_percentage INTEGER DEFAULT 100 CHECK (split_percentage >= 0 AND split_percentage <= 100),

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Unique constraint per campaign and variant
    UNIQUE(campaign_id, template_id, variant_name)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_templates_mood_tags ON public.email_templates USING gin(mood_tags);
CREATE INDEX IF NOT EXISTS idx_templates_custom_tags ON public.email_templates USING gin(custom_tags);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON public.email_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_templates_status ON public.email_templates(status);
CREATE INDEX IF NOT EXISTS idx_templates_scenario ON public.email_templates(scenario);

CREATE INDEX IF NOT EXISTS idx_cart_user_id ON public.user_template_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_template_id ON public.user_template_cart(template_id);
CREATE INDEX IF NOT EXISTS idx_cart_favorite ON public.user_template_cart(is_favorite);

CREATE INDEX IF NOT EXISTS idx_campaign_templates_campaign ON public.campaign_templates(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_templates_template ON public.campaign_templates(template_id);

-- Enable Row Level Security
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_template_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Email Templates
DROP POLICY IF EXISTS "Anyone can view system templates" ON public.email_templates;
CREATE POLICY "Anyone can view system templates" ON public.email_templates
    FOR SELECT
    USING (is_system = true OR created_by IN (
        SELECT id FROM public.users WHERE clerk_user_id = public.requesting_user_id()
    ));

DROP POLICY IF EXISTS "Users can create custom templates" ON public.email_templates;
CREATE POLICY "Users can create custom templates" ON public.email_templates
    FOR INSERT
    WITH CHECK (created_by IN (
        SELECT id FROM public.users WHERE clerk_user_id = public.requesting_user_id()
    ));

DROP POLICY IF EXISTS "Users can update own templates" ON public.email_templates;
CREATE POLICY "Users can update own templates" ON public.email_templates
    FOR UPDATE
    USING (created_by IN (
        SELECT id FROM public.users WHERE clerk_user_id = public.requesting_user_id()
    ));

DROP POLICY IF EXISTS "Users can delete own templates" ON public.email_templates;
CREATE POLICY "Users can delete own templates" ON public.email_templates
    FOR DELETE
    USING (created_by IN (
        SELECT id FROM public.users WHERE clerk_user_id = public.requesting_user_id()
    ));

-- RLS Policies for User Template Cart
DROP POLICY IF EXISTS "Users can manage own cart" ON public.user_template_cart;
CREATE POLICY "Users can manage own cart" ON public.user_template_cart
    FOR ALL
    USING (user_id IN (
        SELECT id FROM public.users WHERE clerk_user_id = public.requesting_user_id()
    ));

-- RLS Policies for Campaign Templates
DROP POLICY IF EXISTS "Users can manage campaign templates" ON public.campaign_templates;
CREATE POLICY "Users can manage campaign templates" ON public.campaign_templates
    FOR ALL
    USING (campaign_id IN (
        SELECT c.id FROM public.campaigns c
        JOIN public.users u ON c.user_id = u.id
        WHERE u.clerk_user_id = public.requesting_user_id()
    ));

-- Insert 10 Pre-built System Templates
INSERT INTO public.email_templates (name, description, content, subject_template, is_system, mood_tags, scenario, preview_text, variables) VALUES

-- 1. Professional Introduction
('Professional Introduction', 'A formal introduction email for new business contacts',
'Hi {{recipientName}},

I''m {{senderName}} from {{companyName}}. I came across {{recipientCompany}} and was impressed by your work in the {{industry}} industry.

We specialize in helping companies like yours {{valueProposition}}. I''d love to explore how we might work together.

Would you be open to a brief call next week?

Best regards,
{{senderName}}
{{senderTitle}}
{{companyName}}',
'Introduction from {{companyName}}',
true,
ARRAY['professional', 'formal'],
'Professional Introduction',
'Formal introduction for new business contacts...',
'{"recipientName": "Lead name", "senderName": "Your name", "companyName": "Your company", "recipientCompany": "Lead company", "industry": "Lead industry", "valueProposition": "Your value prop", "senderTitle": "Your title"}'::jsonb),

-- 2. Friendly Follow-up
('Friendly Follow-up', 'A warm follow-up email after initial contact',
'Hey {{recipientName}},

Hope you''re doing well! I wanted to follow up on our conversation about {{topic}}.

I''ve been thinking about what you mentioned regarding {{painPoint}}, and I believe {{companyName}} could help with that.

No pressure at all - just wanted to keep the conversation going. Let me know if you''d like to chat more!

Cheers,
{{senderName}}',
'Following up - {{topic}}',
true,
ARRAY['friendly', 'casual', 'warm'],
'Friendly Follow-up',
'Warm follow-up after initial conversation...',
'{"recipientName": "Lead name", "senderName": "Your name", "topic": "Discussion topic", "painPoint": "Their challenge", "companyName": "Your company"}'::jsonb),

-- 3. Sales Pitch
('Sales Pitch', 'A persuasive sales email highlighting benefits',
'Hi {{recipientName}},

I noticed {{recipientCompany}} is in {{industry}}, and I thought you might be interested in how {{companyName}} has helped similar companies achieve {{result}}.

Here''s what we offer:
• {{benefit1}}
• {{benefit2}}
• {{benefit3}}

{{socialProof}}

Would you be interested in a quick 15-minute demo?

Best,
{{senderName}}
{{companyName}}',
'How {{companyName}} can help {{recipientCompany}}',
true,
ARRAY['professional', 'persuasive'],
'Sales Pitch',
'Persuasive pitch highlighting key benefits...',
'{"recipientName": "Lead name", "recipientCompany": "Lead company", "industry": "Lead industry", "companyName": "Your company", "result": "Key result", "benefit1": "Benefit 1", "benefit2": "Benefit 2", "benefit3": "Benefit 3", "socialProof": "Social proof", "senderName": "Your name"}'::jsonb),

-- 4. Event Invitation
('Event Invitation', 'Invite leads to webinars, conferences, or events',
'Hi {{recipientName}},

You''re invited to {{eventName}}!

📅 Date: {{eventDate}}
🕐 Time: {{eventTime}}
📍 Location: {{eventLocation}}

What you''ll learn:
• {{topic1}}
• {{topic2}}
• {{topic3}}

We''d love to see you there. Register here: {{registrationLink}}

Looking forward to it!
{{senderName}}',
'You''re invited: {{eventName}}',
true,
ARRAY['friendly', 'professional'],
'Event Invitation',
'Invite to webinars, events, or conferences...',
'{"recipientName": "Lead name", "eventName": "Event name", "eventDate": "Event date", "eventTime": "Event time", "eventLocation": "Location", "topic1": "Topic 1", "topic2": "Topic 2", "topic3": "Topic 3", "registrationLink": "Link", "senderName": "Your name"}'::jsonb),

-- 5. Apology Message
('Apology Message', 'Professional apology for service issues or delays',
'Dear {{recipientName}},

I want to sincerely apologize for {{issue}}. This doesn''t reflect the standard we hold ourselves to at {{companyName}}.

Here''s what happened: {{explanation}}

To make this right, we''re {{resolution}}.

I truly appreciate your patience and understanding. If you have any questions, please don''t hesitate to reach out.

Sincerely,
{{senderName}}
{{senderTitle}}
{{companyName}}',
'Our apologies - {{issue}}',
true,
ARRAY['apologetic', 'empathetic', 'professional'],
'Apology Message',
'Sincere apology for issues or delays...',
'{"recipientName": "Lead name", "issue": "What went wrong", "companyName": "Your company", "explanation": "Brief explanation", "resolution": "How you''ll fix it", "senderName": "Your name", "senderTitle": "Your title"}'::jsonb),

-- 6. Urgent Notification
('Urgent Notification', 'Time-sensitive updates or important notices',
'URGENT: {{subject}}

Hi {{recipientName}},

This is a time-sensitive message regarding {{urgentMatter}}.

What you need to know:
{{details}}

Action required: {{actionNeeded}}
Deadline: {{deadline}}

Please respond at your earliest convenience.

Thanks,
{{senderName}}
{{companyName}}',
'URGENT: {{subject}}',
true,
ARRAY['urgent', 'professional'],
'Urgent Notification',
'Time-sensitive updates and notifications...',
'{"recipientName": "Lead name", "subject": "Urgent subject", "urgentMatter": "What''s urgent", "details": "Important details", "actionNeeded": "Required action", "deadline": "When", "senderName": "Your name", "companyName": "Your company"}'::jsonb),

-- 7. Thank You Note
('Thank You Note', 'Express gratitude to clients or partners',
'Hi {{recipientName}},

I wanted to take a moment to say thank you for {{reason}}.

{{personalNote}}

It''s been a pleasure working with {{recipientCompany}}, and I look forward to {{futureEngagement}}.

Thanks again!

Best wishes,
{{senderName}}
{{companyName}}',
'Thank you, {{recipientName}}!',
true,
ARRAY['warm', 'friendly', 'celebratory'],
'Thank You Note',
'Express gratitude and appreciation...',
'{"recipientName": "Lead name", "reason": "What you''re thanking for", "personalNote": "Personal message", "recipientCompany": "Lead company", "futureEngagement": "Future plans", "senderName": "Your name", "companyName": "Your company"}'::jsonb),

-- 8. Newsletter Update
('Newsletter Update', 'Regular updates and company news',
'Hi {{recipientName}},

Here''s what''s new at {{companyName}} this {{period}}:

📰 Latest News: {{news1}}
🚀 New Features: {{feature1}}
📊 Success Story: {{successStory}}

🔗 Read more: {{linkToFullNewsletter}}

Want to stay updated? Follow us on {{socialLinks}}.

Cheers,
{{senderName}}
The {{companyName}} Team',
'{{companyName}} Update - {{period}}',
true,
ARRAY['friendly', 'professional'],
'Newsletter Update',
'Regular updates and company news...',
'{"recipientName": "Lead name", "companyName": "Your company", "period": "This month/week", "news1": "News item", "feature1": "New feature", "successStory": "Customer story", "linkToFullNewsletter": "Link", "socialLinks": "Social media", "senderName": "Your name"}'::jsonb),

-- 9. Customer Support Response
('Customer Support Response', 'Professional support email response',
'Hi {{recipientName}},

Thanks for reaching out about {{issue}}.

I''ve looked into this, and here''s what I found:
{{solution}}

Steps to resolve:
1. {{step1}}
2. {{step2}}
3. {{step3}}

If this doesn''t solve the issue, please reply to this email and I''ll escalate to our technical team immediately.

We appreciate your patience!

Best,
{{senderName}}
Customer Support Team
{{companyName}}',
'Re: {{issue}} - Solution',
true,
ARRAY['empathetic', 'professional', 'helpful'],
'Customer Support Response',
'Professional support responses...',
'{"recipientName": "Lead name", "issue": "Their issue", "solution": "The solution", "step1": "Step 1", "step2": "Step 2", "step3": "Step 3", "senderName": "Your name", "companyName": "Your company"}'::jsonb),

-- 10. Meeting Request
('Meeting Request', 'Request a meeting or call with prospects',
'Hi {{recipientName}},

I''d love to schedule a brief {{meetingType}} to discuss {{topic}}.

I''m available:
• {{timeSlot1}}
• {{timeSlot2}}
• {{timeSlot3}}

The call will take about {{duration}}, and we''ll cover:
• {{agenda1}}
• {{agenda2}}

Does any of these times work for you? If not, feel free to suggest an alternative.

Looking forward to connecting!

{{senderName}}
{{companyName}}
{{calendlyLink}}',
'Meeting request: {{topic}}',
true,
ARRAY['professional', 'friendly'],
'Meeting Request',
'Schedule meetings with prospects...',
'{"recipientName": "Lead name", "meetingType": "call/meeting", "topic": "Discussion topic", "timeSlot1": "Option 1", "timeSlot2": "Option 2", "timeSlot3": "Option 3", "duration": "15 mins", "agenda1": "Point 1", "agenda2": "Point 2", "senderName": "Your name", "companyName": "Your company", "calendlyLink": "Booking link"}'::jsonb);

-- Function to increment template usage count
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.email_templates
    SET usage_count = usage_count + 1
    WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;
