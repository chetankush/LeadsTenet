import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Best-effort analytics for the outreach product. Writes NEVER throw and never
 * block a user action: if the table is missing (migration not yet applied) or a
 * write fails, we log and move on. These power the validation funnel + the
 * dashboard's "emails sent / reply rate" without coupling the core flow to
 * analytics availability.
 */

export type OutreachEventType =
  | 'resume_uploaded'
  | 'generated'
  | 'sent'
  | 'marked_replied'
  | 'pro_intent'

export async function logOutreachEvent(
  supabase: SupabaseClient,
  userId: string,
  type: OutreachEventType,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const { error } = await supabase
      .from('outreach_events')
      .insert({ user_id: userId, type, metadata })
    if (error) console.warn(`[outreach] logEvent(${type}) failed (non-fatal):`, error.message)
  } catch (e) {
    console.warn(`[outreach] logEvent(${type}) threw (non-fatal):`, e)
  }
}

export interface SendRecordInput {
  company?: string
  role?: string
  toEmail: string
  subject?: string
  region?: string
  messageId?: string | null
}

/** Records a sent email and returns its row id (for later "mark replied"). */
export async function recordOutreachSend(
  supabase: SupabaseClient,
  userId: string,
  input: SendRecordInput
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('outreach_sends')
      .insert({
        user_id: userId,
        company: input.company ?? '',
        role: input.role ?? '',
        to_email: input.toEmail,
        subject: input.subject ?? '',
        region: input.region ?? 'other',
        message_id: input.messageId ?? null,
      })
      .select('id')
      .single()
    if (error) {
      console.warn('[outreach] recordSend failed (non-fatal):', error.message)
      return null
    }
    return (data as { id: string } | null)?.id ?? null
  } catch (e) {
    console.warn('[outreach] recordSend threw (non-fatal):', e)
    return null
  }
}

/** Marks a follow-up as sent on an existing send record (increments the count). */
export async function recordFollowupSent(
  supabase: SupabaseClient,
  userId: string,
  sendId: string
): Promise<boolean> {
  try {
    const { data: row } = await supabase
      .from('outreach_sends')
      .select('followups_sent')
      .eq('id', sendId)
      .eq('user_id', userId)
      .single()
    const current = Number((row as { followups_sent?: number } | null)?.followups_sent ?? 0)
    const { error } = await supabase
      .from('outreach_sends')
      .update({ followups_sent: current + 1, last_followup_at: new Date().toISOString() })
      .eq('id', sendId)
      .eq('user_id', userId)
    if (error) {
      console.warn('[outreach] recordFollowupSent failed (non-fatal):', error.message)
      return false
    }
    return true
  } catch (e) {
    console.warn('[outreach] recordFollowupSent threw (non-fatal):', e)
    return false
  }
}
