import { getSupabaseClient } from './supabase-client'

export interface User {
  id: string
  email: string
  full_name: string | null
  company_name: string | null
  subscription_tier: 'free' | 'pro' | 'enterprise'
  subscription_status: 'active' | 'canceled' | 'past_due'
  emails_per_month: number
  campaigns_limit: number
  leads_per_upload: number
  dodo_customer_id?: string | null
  dodo_subscription_id?: string | null
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  user_id: string
  name: string
  description: string | null
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  from_email: string | null
  from_name: string | null
  reply_to_email: string | null
  total_leads: number
  emails_sent: number
  emails_delivered: number
  emails_opened: number
  emails_failed: number
  created_at: string
  updated_at: string
  last_sent_at?: string | null
}

export interface Lead {
  id: string
  campaign_id: string
  name: string | null
  email: string
  company: string | null
  industry: string | null
  additional_data: Record<string, any>
  status: 'pending' | 'processed' | 'sent' | 'failed' | 'bounced'
  ai_confidence: number | null
  created_at: string
  processed_at: string | null
  last_contacted_at?: string | null
}

export interface EmailLog {
  id: string
  lead_id: string
  campaign_id: string
  subject: string
  from_email: string
  to_email: string
  status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'complained' | 'opened' | 'clicked' | 'failed'
  message_id: string | null
  error_message: string | null
  sent_at: string
}

export interface UsageLimit {
  user_id: string
  action: string
  current_count: number
  limit: number
  period: string
  can_perform: boolean
}

interface RequestContext {
  supabase: any
  userId: string | null
}

/**
 * Data-access layer scoped to the signed-in Supabase user.
 *
 * Each method resolves a fresh, request-scoped Supabase client and the current
 * `auth.uid()` on every call. No per-request state is stored on the instance,
 * so the exported singleton is safe to share across concurrent requests.
 * Row Level Security enforces tenant isolation at the database layer.
 */
export class DatabaseService {
  // Resolve a request-scoped client + the authenticated user id.
  private async getContext(): Promise<RequestContext> {
    try {
      const supabase = await getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      return { supabase, userId: user?.id ?? null }
    } catch (error) {
      console.warn('Database context initialization failed:', error)
      return { supabase: null, userId: null }
    }
  }

  private async resolveUser(supabase: any, userId: string | null): Promise<User | null> {
    if (!supabase || !userId) return null

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      // PGRST116 = no row yet (first login before profile is provisioned)
      if (error.code === 'PGRST116') return null
      console.error('Error fetching user:', error)
      return null
    }

    return data
  }

  // User Management
  async getCurrentUser(): Promise<User | null> {
    const { supabase, userId } = await this.getContext()
    return this.resolveUser(supabase, userId)
  }

  async getOrCreateUser(userData?: {
    email: string
    full_name?: string | null
    company_name?: string | null
  }): Promise<User | null> {
    const { supabase, userId } = await this.getContext()
    if (!supabase || !userId) return null

    const existing = await this.resolveUser(supabase, userId)
    if (existing) return existing

    if (!userData) return null

    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        subscription_tier: 'free',
        subscription_status: 'active',
        emails_per_month: 100,
        campaigns_limit: 5,
        leads_per_upload: 500,
        ...userData,
      })
      .select()
      .single()

    if (error) {
      // 23505 = unique violation (row created concurrently, e.g. by the
      // handle_new_user trigger). Re-fetch instead of failing.
      if (error.code === '23505') {
        return this.resolveUser(supabase, userId)
      }
      console.error('Error creating user:', error)
      return null
    }

    return data
  }

  async updateUser(updates: Partial<User>): Promise<User | null> {
    const { supabase, userId } = await this.getContext()
    if (!supabase || !userId) return null

    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return null
    }

    return data
  }

  // Campaign Management
  async getUserCampaigns(): Promise<Campaign[]> {
    const { supabase, userId } = await this.getContext()
    if (!supabase || !userId) return []

    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching campaigns:', error)
      return []
    }

    return data || []
  }

  async createCampaign(campaignData: {
    name: string
    description?: string
    from_email?: string | null
    from_name?: string | null
    reply_to_email?: string | null
  }): Promise<Campaign | null> {
    const { supabase, userId } = await this.getContext()
    if (!supabase || !userId) return null

    const { data, error } = await supabase
      .from('campaigns')
      .insert({ user_id: userId, ...campaignData })
      .select()
      .single()

    if (error) {
      console.error('Error creating campaign:', error)
      return null
    }

    return data
  }

  async getCampaign(campaignId: string): Promise<Campaign | null> {
    const { supabase, userId } = await this.getContext()
    if (!supabase || !userId) return null

    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('Error fetching campaign:', error)
      return null
    }

    return data
  }

  async updateCampaign(campaignId: string, updates: Partial<Campaign>): Promise<Campaign | null> {
    const { supabase, userId } = await this.getContext()
    if (!supabase || !userId) return null

    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', campaignId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating campaign:', error)
      return null
    }

    return data
  }

  async deleteCampaign(campaignId: string): Promise<boolean> {
    const { supabase, userId } = await this.getContext()
    if (!supabase || !userId) return false

    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting campaign:', error)
      return false
    }

    return true
  }

  // Lead Management
  async getCampaignLeads(campaignId: string): Promise<Lead[]> {
    // Ownership is enforced by RLS (leads visible only for the user's campaigns)
    // and callers verify campaign ownership via getCampaign() first.
    const { supabase, userId } = await this.getContext()
    if (!supabase || !userId) return []

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching leads:', error)
      return []
    }

    return data || []
  }

  async createLeads(campaignId: string, leadsData: Array<{
    name?: string
    email: string
    company?: string
    industry?: string
    additional_data?: Record<string, any>
  }>): Promise<Lead[]> {
    const { supabase, userId } = await this.getContext()
    if (!supabase || !userId) return []

    const leadsToInsert = leadsData.map((lead) => ({ campaign_id: campaignId, ...lead }))

    const { data, error } = await supabase.from('leads').insert(leadsToInsert).select()

    if (error) {
      console.error('Error creating leads:', error)
      return []
    }

    return data || []
  }

  async updateLead(leadId: string, updates: Partial<Lead>): Promise<Lead | null> {
    const { supabase, userId } = await this.getContext()
    if (!supabase || !userId) return null

    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', leadId)
      .select()
      .single()

    if (error) {
      console.error('Error updating lead:', error)
      return null
    }

    return data
  }

  // Email Logging
  async createEmailLog(emailData: {
    lead_id: string
    campaign_id: string
    subject: string
    from_email: string
    to_email: string
    message_id?: string
    status: EmailLog['status']
  }): Promise<EmailLog | null> {
    const { supabase, userId } = await this.getContext()
    if (!supabase || !userId) return null

    const { data, error } = await supabase
      .from('email_logs')
      .insert(emailData)
      .select()
      .single()

    if (error) {
      console.error('Error creating email log:', error)
      return null
    }

    return data
  }

  async updateEmailLogStatus(
    emailLogId: string,
    status: EmailLog['status'],
    errorMessage?: string
  ): Promise<void> {
    const { supabase, userId } = await this.getContext()
    if (!supabase || !userId) return

    const updates: any = { status }
    if (status === 'delivered') updates.delivered_at = new Date().toISOString()
    if (status === 'opened') updates.opened_at = new Date().toISOString()
    if (status === 'clicked') updates.clicked_at = new Date().toISOString()
    if (errorMessage) updates.error_message = errorMessage

    const { error } = await supabase.from('email_logs').update(updates).eq('id', emailLogId)

    if (error) {
      console.error('Error updating email log status:', error)
    }
  }

  // Usage Tracking
  async checkUsageLimit(action: string, period: string = 'monthly'): Promise<UsageLimit | null> {
    const { supabase, userId } = await this.getContext()
    const user = await this.resolveUser(supabase, userId)
    if (!user) return null

    const { data, error } = await supabase.rpc('check_user_limit', {
      p_user_id: user.id,
      p_action: action,
      p_period: period,
    })

    if (error) {
      console.error('Error checking usage limit:', error)
      return null
    }

    // Get current usage count for the period
    let startDate: string
    const now = new Date()
    if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    } else {
      startDate = now.toISOString().split('T')[0]
    }

    const { data: usageData } = await supabase
      .from('usage_logs')
      .select('count')
      .eq('user_id', user.id)
      .eq('action', action)
      .gte('date', startDate)

    const currentCount = usageData?.reduce((sum: number, log: any) => sum + (log.count || 0), 0) || 0

    let limit = 0
    switch (action) {
      case 'email_sent':
        limit = user.emails_per_month
        break
      case 'campaign_created':
        limit = user.campaigns_limit
        break
      default:
        limit = 999999
    }

    return {
      user_id: user.id,
      action,
      current_count: currentCount,
      limit,
      period,
      can_perform: data as boolean,
    }
  }

  async recordUsage(action: string, count: number = 1, campaignId?: string): Promise<void> {
    const { supabase, userId } = await this.getContext()
    const user = await this.resolveUser(supabase, userId)
    if (!user) return

    const { error } = await supabase.rpc('record_usage', {
      p_user_id: user.id,
      p_action: action,
      p_count: count,
      p_campaign_id: campaignId,
    })

    if (error) {
      console.error('Error recording usage:', error)
    }
  }

  // Dashboard Statistics
  async getDashboardStats(): Promise<any> {
    const { supabase, userId } = await this.getContext()
    if (!supabase || !userId) return null

    const { data, error } = await supabase
      .from('user_dashboard_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('Error fetching dashboard stats:', error)
      return null
    }

    return data
  }

  async getWeeklyUsage(
    userId: string,
    startDate: Date
  ): Promise<Array<{ name: string; emails: number; leads: number }>> {
    try {
      const { supabase } = await this.getContext()
      if (!supabase) return []

      const endDate = new Date()
      const days: Array<{ date: string; name: string; emails: number; leads: number }> = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        days.push({
          date: date.toISOString().split('T')[0],
          name: date.toLocaleDateString('en-US', { weekday: 'short' }),
          emails: 0,
          leads: 0,
        })
      }

      const { data: emailData, error: emailError } = await supabase
        .from('usage_logs')
        .select('date, count')
        .eq('user_id', userId)
        .eq('action', 'email_sent')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])

      if (emailError) {
        console.error('Error fetching email usage:', emailError)
      } else if (emailData) {
        emailData.forEach((record: any) => {
          const day = days.find((d) => d.date === record.date)
          if (day) day.emails += record.count || 0
        })
      }

      const { data: leadsData, error: leadsError } = await supabase
        .from('usage_logs')
        .select('date, count')
        .eq('user_id', userId)
        .eq('action', 'lead_uploaded')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])

      if (leadsError) {
        console.error('Error fetching leads usage:', leadsError)
      } else if (leadsData) {
        leadsData.forEach((record: any) => {
          const day = days.find((d) => d.date === record.date)
          if (day) day.leads += record.count || 0
        })
      }

      return days.map((day) => ({ name: day.name, emails: day.emails, leads: day.leads }))
    } catch (error) {
      console.error('Error in getWeeklyUsage:', error)
      return []
    }
  }

  // Campaign Performance
  async getCampaignPerformance(campaignId: string): Promise<any> {
    const { supabase, userId } = await this.getContext()
    if (!supabase || !userId) return null

    const { data, error } = await supabase
      .from('campaign_performance')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('Error fetching campaign performance:', error)
      return null
    }

    return data
  }

  // Subscription Management
  async getSubscriptionPlans(): Promise<any[]> {
    const { supabase } = await this.getContext()
    if (!supabase) return []

    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('active', true)
      .order('price_monthly', { ascending: true })

    if (error) {
      console.error('Error fetching subscription plans:', error)
      return []
    }

    return data || []
  }

  async updateUserSubscription(
    subscriptionTier: string,
    dodoCustomerId?: string
  ): Promise<User | null> {
    const { supabase, userId } = await this.getContext()
    const user = await this.resolveUser(supabase, userId)
    if (!user) return null

    const { data: planData } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', subscriptionTier)
      .single()

    if (!planData) return null

    const updates: Partial<User> = {
      subscription_tier: subscriptionTier as any,
      emails_per_month: planData.emails_per_month,
      campaigns_limit: planData.campaigns_limit,
      leads_per_upload: planData.leads_per_upload,
    }

    if (dodoCustomerId) {
      updates.dodo_customer_id = dodoCustomerId
    }

    return this.updateUser(updates)
  }
}

// Export singleton instance (now stateless / concurrency-safe)
export const dbService = new DatabaseService()

// Helper functions
export const getCurrentUser = () => dbService.getCurrentUser()
export const getUserCampaigns = () => dbService.getUserCampaigns()
export const createCampaign = (data: any) => dbService.createCampaign(data)
export const checkUsageLimit = (action: string) => dbService.checkUsageLimit(action)
export const recordUsage = (action: string, count?: number, campaignId?: string) =>
  dbService.recordUsage(action, count, campaignId)
