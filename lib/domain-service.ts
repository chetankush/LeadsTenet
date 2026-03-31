import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/utils/supabase/admin'

interface DomainDNSRecord {
  type: string
  name: string
  value: string
  priority?: number
}

interface ResendDomainResponse {
  id: string
  name: string
  status: 'pending' | 'verified' | 'failed'
  records: DomainDNSRecord[]
}

interface UserDomain {
  id: string
  user_id: string
  domain_name: string
  resend_domain_id: string | null
  status: 'pending' | 'verified' | 'failed'
  verification_error: string | null
  dns_records: DomainDNSRecord[]
  is_default: boolean
  created_at: string
  updated_at: string
  verified_at: string | null
  last_verified_at: string | null
}

interface AddDomainRequest {
  domainName: string
  userId: string
}

interface DomainOperationResult {
  success: boolean
  domain?: UserDomain
  error?: string
  dnsRecords?: DomainDNSRecord[]
}

interface VerifyDomainResult {
  success: boolean
  verified: boolean
  error?: string
  domain?: UserDomain
}

/**
 * Domain Service for managing custom domains with Resend API
 */
export class DomainService {
  private resend: Resend

  constructor() {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required')
    }
    this.resend = new Resend(apiKey)
  }

  /**
   * Add a new domain for a user
   */
  async addUserDomain(request: AddDomainRequest): Promise<DomainOperationResult> {
    const { domainName, userId } = request

    try {
      // Validate domain format
      if (!this.isValidDomain(domainName)) {
        return {
          success: false,
          error: 'Invalid domain format'
        }
      }

      const supabase = getSupabaseAdmin()

      // Check if user exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, subscription_tier')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      // Check domain limits
      const { data: canAddDomain } = await supabase
        .rpc('check_domain_limit', { p_user_id: userId })

      if (!canAddDomain) {
        return {
          success: false,
          error: 'Domain limit reached for your subscription tier'
        }
      }

      // Check if domain already exists
      const { data: existingDomain } = await supabase
        .from('user_domains')
        .select('id')
        .eq('domain_name', domainName)
        .single()

      if (existingDomain) {
        return {
          success: false,
          error: 'Domain already exists'
        }
      }

      // Add domain to Resend
      const resendResult = await this.resend.domains.create({
        name: domainName
      })

      if (resendResult.error) {
        console.error('Resend API error:', resendResult.error)
        return {
          success: false,
          error: `Failed to add domain to Resend: ${resendResult.error.message}`
        }
      }

      const resendDomain = resendResult.data!

      // Store domain in database
      const { data: dbDomain, error: dbError } = await supabase
        .from('user_domains')
        .insert({
          user_id: userId,
          domain_name: domainName,
          resend_domain_id: resendDomain.id,
          status: 'pending',
          dns_records: resendDomain.records || []
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        // Try to cleanup Resend domain if DB insert failed
        try {
          await this.resend.domains.remove(resendDomain.id)
        } catch (cleanupError) {
          console.error('Failed to cleanup Resend domain:', cleanupError)
        }

        return {
          success: false,
          error: 'Failed to store domain in database'
        }
      }

      return {
        success: true,
        domain: dbDomain,
        dnsRecords: resendDomain.records || []
      }

    } catch (error) {
      console.error('Error adding domain:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Verify a domain
   */
  async verifyUserDomain(userId: string, domainId: string): Promise<VerifyDomainResult> {
    try {
      const supabase = getSupabaseAdmin()

      // Get domain from database
      const { data: domain, error: domainError } = await supabase
        .from('user_domains')
        .select('*')
        .eq('id', domainId)
        .eq('user_id', userId)
        .single()

      if (domainError || !domain) {
        return {
          success: false,
          verified: false,
          error: 'Domain not found'
        }
      }

      if (!domain.resend_domain_id) {
        return {
          success: false,
          verified: false,
          error: 'Domain not properly configured with Resend'
        }
      }

      // Verify with Resend API
      const verifyResult = await this.resend.domains.verify(domain.resend_domain_id)

      if (verifyResult.error) {
        console.error('Resend verification error:', verifyResult.error)

        // Update domain with error
        await supabase
          .from('user_domains')
          .update({
            status: 'failed',
            verification_error: verifyResult.error.message,
            last_verified_at: new Date().toISOString()
          })
          .eq('id', domainId)

        return {
          success: false,
          verified: false,
          error: verifyResult.error.message
        }
      }

      const verificationData = verifyResult.data! as any
      const isVerified = verificationData.status === 'verified'

      // Update domain status
      const updateData: any = {
        status: isVerified ? 'verified' : 'pending',
        last_verified_at: new Date().toISOString(),
        verification_error: null
      }

      if (isVerified) {
        updateData.verified_at = new Date().toISOString()
      }

      const { data: updatedDomain, error: updateError } = await supabase
        .from('user_domains')
        .update(updateData)
        .eq('id', domainId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating domain status:', updateError)
        return {
          success: false,
          verified: false,
          error: 'Failed to update domain status'
        }
      }

      return {
        success: true,
        verified: isVerified,
        domain: updatedDomain
      }

    } catch (error) {
      console.error('Error verifying domain:', error)
      return {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get all domains for a user
   */
  async getUserDomains(userId: string): Promise<UserDomain[]> {
    try {
      const supabase = getSupabaseAdmin()

      const { data: domains, error } = await supabase
        .from('user_domains')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user domains:', error)
        return []
      }

      return domains || []

    } catch (error) {
      console.error('Error getting user domains:', error)
      return []
    }
  }

  /**
   * Delete a domain
   */
  async removeUserDomain(userId: string, domainId: string): Promise<DomainOperationResult> {
    try {
      const supabase = getSupabaseAdmin()

      // Get domain from database
      const { data: domain, error: domainError } = await supabase
        .from('user_domains')
        .select('*')
        .eq('id', domainId)
        .eq('user_id', userId)
        .single()

      if (domainError || !domain) {
        return {
          success: false,
          error: 'Domain not found'
        }
      }

      // Remove from Resend if it exists
      if (domain.resend_domain_id) {
        try {
          await this.resend.domains.remove(domain.resend_domain_id)
        } catch (resendError) {
          console.error('Error removing from Resend:', resendError)
          // Continue with database removal even if Resend fails
        }
      }

      // Remove from database
      const { error: deleteError } = await supabase
        .from('user_domains')
        .delete()
        .eq('id', domainId)

      if (deleteError) {
        console.error('Error deleting domain from database:', deleteError)
        return {
          success: false,
          error: 'Failed to delete domain'
        }
      }

      return {
        success: true
      }

    } catch (error) {
      console.error('Error removing domain:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Set a domain as default for a user
   */
  async setUserDefaultDomain(userId: string, domainId: string): Promise<DomainOperationResult> {
    try {
      const supabase = getSupabaseAdmin()

      // Check if domain exists and is verified
      const { data: domain, error: domainError } = await supabase
        .from('user_domains')
        .select('*')
        .eq('id', domainId)
        .eq('user_id', userId)
        .single()

      if (domainError || !domain) {
        return {
          success: false,
          error: 'Domain not found'
        }
      }

      if (domain.status !== 'verified') {
        return {
          success: false,
          error: 'Domain must be verified before setting as default'
        }
      }

      // Update domain as default (trigger will handle unsetting others)
      const { data: updatedDomain, error: updateError } = await supabase
        .from('user_domains')
        .update({ is_default: true })
        .eq('id', domainId)
        .select()
        .single()

      if (updateError) {
        console.error('Error setting default domain:', updateError)
        return {
          success: false,
          error: 'Failed to set domain as default'
        }
      }

      return {
        success: true,
        domain: updatedDomain
      }

    } catch (error) {
      console.error('Error setting default domain:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get user's default domain
   */
  async getUserDefaultDomain(userId: string): Promise<UserDomain | null> {
    try {
      const supabase = getSupabaseAdmin()

      const { data: domain } = await supabase
        .rpc('get_user_default_domain', { p_user_id: userId })

      return domain || null

    } catch (error) {
      console.error('Error getting default domain:', error)
      return null
    }
  }

  /**
   * Get domain by ID for a user
   */
  async getUserDomain(userId: string, domainId: string): Promise<UserDomain | null> {
    try {
      const supabase = getSupabaseAdmin()

      const { data: domain, error } = await supabase
        .from('user_domains')
        .select('*')
        .eq('id', domainId)
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching domain:', error)
        return null
      }

      return domain

    } catch (error) {
      console.error('Error getting domain:', error)
      return null
    }
  }

  /**
   * Validate domain format
   */
  private isValidDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/
    return domainRegex.test(domain) && domain.length <= 253
  }

  /**
   * Format domain for email sending
   */
  getEmailFromAddress(domain: UserDomain, localPart: string = 'noreply'): string {
    return `${localPart}@${domain.domain_name}`
  }

  /**
   * Check if domain is ready for sending
   */
  isDomainReadyForSending(domain: UserDomain): boolean {
    return domain.status === 'verified' && domain.resend_domain_id !== null
  }
}

// Export singleton instance
export const domainService = new DomainService()

// Export types
export type {
  UserDomain,
  DomainDNSRecord,
  AddDomainRequest,
  DomainOperationResult,
  VerifyDomainResult
}