import { getSupabaseClient } from './supabase-client'
import { auth } from '@clerk/nextjs/server'

export interface User {
  id: string
  clerk_user_id: string
  email: string
  full_name: string | null
  company_name: string | null
  subscription_tier: 'free' | 'pro' | 'enterprise'
  subscription_status: 'active' | 'canceled' | 'past_due'
  emails_per_month: number
  campaigns_limit: number
  leads_per_upload: number
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
}

export interface EmailLog {
  id: string
  lead_id: string
  campaign_id: string
  subject: string
  from_email: string
  to_email: string
  status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'complained' | 'opened' | 'clicked'
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

export class DatabaseService {
  private userId: string | null = null
  private supabase: any = null
  private initialized: boolean = false

  constructor() {
    // Don't initialize in constructor to avoid async issues during build
  }

  private async ensureInitialized() {
    if (this.initialized) return

    try {
      this.supabase = await getSupabaseClient()
      const { userId } = await auth()
      this.userId = userId
      this.initialized = true
    } catch (error) {
      console.warn('Database service initialization failed:', error)
      this.initialized = true
    }
  }

  // User Management
  async getCurrentUser(): Promise<User | null> {
    try {
      await this.ensureInitialized()
      if (!this.supabase || !this.userId) return null

      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('clerk_user_id', this.userId)
        .single()

      if (error) {
        // User doesn't exist yet, this is normal for first login
        if (error.code === 'PGRST116') {
          return null
        }
        console.error('Error fetching user:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getCurrentUser:', error)
      return null
    }
  }

  async getOrCreateUser(userData?: {
    email: string
    full_name?: string
    company_name?: string
  }): Promise<User | null> {
    try {
      // First try to get existing user
      let user = await this.getCurrentUser()
      
      // If user doesn't exist, create them
      if (!user && userData) {
        user = await this.createUser(userData)
      }
      
      return user
    } catch (error) {
      console.error('Error in getOrCreateUser:', error)
      return null
    }
  }

  async createUser(userData: {
    email: string
    full_name?: string
    company_name?: string
    subscription_tier?: 'free' | 'pro' | 'enterprise'
  }): Promise<User | null> {
    try {
      await this.ensureInitialized()
      if (!this.supabase || !this.userId) return null

      const { data, error } = await this.supabase
        .from('users')
        .insert({
          clerk_user_id: this.userId,
          subscription_tier: 'free',
          subscription_status: 'active',
          emails_per_month: 100,
          campaigns_limit: 5,
          leads_per_upload: 500,
          ...userData
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating user:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in createUser:', error)
      return null
    }
  }

  async updateUser(updates: Partial<User>): Promise<User | null> {
    try {
      await this.ensureInitialized()
      if (!this.supabase || !this.userId) return null

      const { data, error } = await this.supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('clerk_user_id', this.userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating user:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in updateUser:', error)
      return null
    }
  }

  // Campaign Management
  async getUserCampaigns(): Promise<Campaign[]> {
    const user = await this.getCurrentUser()
    if (!user) return []

    const { data, error } = await this.supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', user.id)
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
    from_email?: string
    from_name?: string
    reply_to_email?: string
  }): Promise<Campaign | null> {
    const user = await this.getCurrentUser()
    if (!user) return null

    const { data, error } = await this.supabase
      .from('campaigns')
      .insert({
        user_id: user.id,
        ...campaignData
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating campaign:', error)
      return null
    }

    return data
  }

  async getCampaign(campaignId: string): Promise<Campaign | null> {
    const user = await this.getCurrentUser()
    if (!user) return null

    const { data, error } = await this.supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching campaign:', error)
      return null
    }

    return data
  }

  async updateCampaign(campaignId: string, updates: Partial<Campaign>): Promise<Campaign | null> {
    const user = await this.getCurrentUser()
    if (!user) return null

    const { data, error } = await this.supabase
      .from('campaigns')
      .update(updates)
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating campaign:', error)
      return null
    }

    return data
  }

  async deleteCampaign(campaignId: string): Promise<boolean> {
    const user = await this.getCurrentUser()
    if (!user) return false

    const { error } = await this.supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting campaign:', error)
      return false
    }

    return true
  }

  // Lead Management
  async getCampaignLeads(campaignId: string): Promise<Lead[]> {
    const { data, error } = await this.supabase
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
    const leadsToInsert = leadsData.map(lead => ({
      campaign_id: campaignId,
      ...lead
    }))

    const { data, error } = await this.supabase
      .from('leads')
      .insert(leadsToInsert)
      .select()

    if (error) {
      console.error('Error creating leads:', error)
      return []
    }

    return data || []
  }

  async updateLead(leadId: string, updates: Partial<Lead>): Promise<Lead | null> {
    const { data, error } = await this.supabase
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
    body_text?: string
    body_html?: string
    from_email: string
    to_email: string
    message_id?: string
    status: EmailLog['status']
  }): Promise<EmailLog | null> {
    const { data, error} = await this.supabase
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

  // Get email logs for a campaign
  async getCampaignEmailLogs(campaignId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('email_logs')
      .select(`
        *,
        leads:lead_id (
          name,
          email,
          company
        )
      `)
      .eq('campaign_id', campaignId)
      .order('sent_at', { ascending: false })

    if (error) {
      console.error('Error fetching email logs:', error)
      return []
    }

    return data || []
  }

  async updateEmailLogStatus(emailLogId: string, status: EmailLog['status'], errorMessage?: string): Promise<void> {
    const updates: any = { status }
    
    if (status === 'delivered') updates.delivered_at = new Date().toISOString()
    if (status === 'opened') updates.opened_at = new Date().toISOString()
    if (status === 'clicked') updates.clicked_at = new Date().toISOString()
    if (errorMessage) updates.error_message = errorMessage

    const { error } = await this.supabase
      .from('email_logs')
      .update(updates)
      .eq('id', emailLogId)

    if (error) {
      console.error('Error updating email log status:', error)
    }
  }

  // Usage Tracking
  async checkUsageLimit(action: string, period: string = 'monthly'): Promise<UsageLimit | null> {
    const user = await this.getCurrentUser()
    if (!user) return null

    const { data, error } = await this.supabase
      .rpc('check_user_limit', {
        p_user_id: user.id,
        p_action: action,
        p_period: period
      })

    if (error) {
      console.error('Error checking usage limit:', error)
      return null
    }

    // Get current usage count
    let startDate: string
    const now = new Date()
    if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    } else {
      startDate = now.toISOString().split('T')[0]
    }

    const { data: usageData } = await this.supabase
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
      can_perform: data as boolean
    }
  }

  async recordUsage(action: string, count: number = 1, campaignId?: string): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user) return

    const { error } = await this.supabase
      .rpc('record_usage', {
        p_user_id: user.id,
        p_action: action,
        p_count: count,
        p_campaign_id: campaignId
      })

    if (error) {
      console.error('Error recording usage:', error)
    }
  }

  // Dashboard Statistics
  async getDashboardStats(): Promise<any> {
    const user = await this.getCurrentUser()
    if (!user) return null

    // Get campaign stats
    const { data: campaigns } = await this.supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', user.id)

    const totalCampaigns = campaigns?.length || 0
    const activeCampaigns = campaigns?.filter((c: any) => c.status === 'active').length || 0

    // Get total leads
    const { count: totalLeads } = await this.supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .in('campaign_id', campaigns?.map((c: any) => c.id) || [])

    // Get email stats
    const { count: totalEmails } = await this.supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .in('campaign_id', campaigns?.map((c: any) => c.id) || [])

    const { count: openedEmails } = await this.supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .in('campaign_id', campaigns?.map((c: any) => c.id) || [])
      .eq('status', 'opened')

    return {
      totalCampaigns,
      activeCampaigns,
      totalLeads: totalLeads || 0,
      totalEmails: totalEmails || 0,
      openedEmails: openedEmails || 0,
      openRate: totalEmails ? Math.round((openedEmails || 0) / totalEmails * 100) : 0
    }
  }

  async getWeeklyUsage(userId: string, startDate: Date): Promise<Array<{name: string, emails: number, leads: number}>> {
    try {
      await this.ensureInitialized()
      if (!this.supabase) return []

      // Get the last 7 days of data
      const endDate = new Date()
      const days: Array<{date: string, name: string, emails: number, leads: number}> = []

      // Create array of last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        days.push({
          date: date.toISOString().split('T')[0], // YYYY-MM-DD format
          name: date.toLocaleDateString('en-US', { weekday: 'short' }), // Mon, Tue, etc.
          emails: 0,
          leads: 0
        })
      }

      // Get email usage data
      const { data: emailData, error: emailError } = await this.supabase
        .from('usage_logs')
        .select('date, count')
        .eq('user_id', userId)
        .eq('action', 'email_sent')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])

      if (emailError) {
        console.error('Error fetching email usage:', emailError)
      } else if (emailData) {
        // Map email data to days
        emailData.forEach((record: any) => {
          const day = days.find(d => d.date === record.date)
          if (day) {
            day.emails += record.count || 0
          }
        })
      }

      // Get leads usage data
      const { data: leadsData, error: leadsError } = await this.supabase
        .from('usage_logs')
        .select('date, count')
        .eq('user_id', userId)
        .eq('action', 'lead_uploaded')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])

      if (leadsError) {
        console.error('Error fetching leads usage:', leadsError)
      } else if (leadsData) {
        // Map leads data to days
        leadsData.forEach((record: any) => {
          const day = days.find(d => d.date === record.date)
          if (day) {
            day.leads += record.count || 0
          }
        })
      }

      // Return only name, emails, leads for chart
      return days.map(day => ({
        name: day.name,
        emails: day.emails,
        leads: day.leads
      }))

    } catch (error) {
      console.error('Error in getWeeklyUsage:', error)
      return []
    }
  }

  // Campaign Performance
  async getCampaignPerformance(campaignId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('campaign_performance')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (error) {
      console.error('Error fetching campaign performance:', error)
      return null
    }

    return data
  }

  // Subscription Management
  async getSubscriptionPlans(): Promise<any[]> {
    const { data, error } = await this.supabase
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

  async updateUserSubscription(subscriptionTier: string, stripeCustomerId?: string): Promise<User | null> {
    const user = await this.getCurrentUser()
    if (!user) return null

    // TODO: Uncomment when Stripe is configured
    // For now, just update the subscription tier without Stripe integration

    // Get subscription limits
    const { data: planData } = await this.supabase
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

    // TODO: Enable when Stripe is configured
    // if (stripeCustomerId) {
    //   updates.stripe_customer_id = stripeCustomerId
    // }

    return await this.updateUser(updates)
  }
}

// Export singleton instance
export const dbService = new DatabaseService()

// Helper functions
export const getCurrentUser = () => dbService.getCurrentUser()
export const getUserCampaigns = () => dbService.getUserCampaigns()
export const createCampaign = (data: any) => dbService.createCampaign(data)
export const checkUsageLimit = (action: string) => dbService.checkUsageLimit(action)
export const recordUsage = (action: string, count?: number, campaignId?: string) => 
  dbService.recordUsage(action, count, campaignId)