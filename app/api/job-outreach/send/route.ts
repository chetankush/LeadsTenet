import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { getAuthUser } from '@/lib/auth-helpers'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { getRegion } from '@/lib/send-timing'
import { recordOutreachSend, recordFollowupSent, logOutreachEvent } from '@/lib/outreach-analytics'

/**
 * Sends a single job-application email from the STUDENT'S OWN Gmail using an
 * app password over SMTP. Nothing is sent through the platform's shared sender —
 * each student uses their own mailbox and reputation, which is exactly right for
 * low-volume, one-to-one job outreach.
 *
 * Note: app passwords require 2-Step Verification on the Google account. The
 * password is used per-request and never stored server-side. For production,
 * Gmail OAuth would replace app passwords.
 */

interface SendRequest {
  gmailUser: string
  gmailAppPassword: string
  fromName?: string
  to: string
  subject: string
  body: string // plain text
  // Optional metadata for the durable send record / analytics.
  company?: string
  role?: string
  region?: string
  // When set, this send is a follow-up to an existing send record (no new row).
  followupOf?: string
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

function toHtml(body: string): string {
  const escaped = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
  // Linkify bare URLs so résumé/portfolio links are clickable (quotes already escaped).
  const linked = escaped.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>')
  const paragraphs = linked.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')
  return `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #222;"><p>${paragraphs}</p></div>`
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Real emails leave the building here — cap per user per minute.
    const rl = rateLimit(`job-send:${user.id}`, 30, 60_000)
    if (!rl.success) return tooManyRequests(rl)

    const body: SendRequest = await request.json()
    const { gmailUser, gmailAppPassword, fromName, to, subject } = body

    if (!gmailUser || !gmailAppPassword) {
      return NextResponse.json(
        { error: 'Connect your Gmail (email + app password) first' },
        { status: 400 }
      )
    }
    if (!isValidEmail(gmailUser)) {
      return NextResponse.json({ error: 'Your Gmail address looks invalid' }, { status: 400 })
    }
    if (!isValidEmail(to)) {
      return NextResponse.json({ error: `Recipient email looks invalid: ${to}` }, { status: 400 })
    }
    if (!subject?.trim() || !body.body?.trim()) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
    }
    if (subject.length > 300) {
      return NextResponse.json({ error: 'Subject is too long' }, { status: 400 })
    }
    if (body.body.length > 20000) {
      return NextResponse.json({ error: 'Email body is too long' }, { status: 400 })
    }

    // For follow-ups: enforce cadence/cap server-side and grab the original
    // message id so the follow-up threads under the first email.
    let inReplyToId: string | undefined
    if (body.followupOf) {
      const { data: orig } = await supabase
        .from('outreach_sends')
        .select('message_id, replied_at, followups_sent')
        .eq('id', body.followupOf)
        .eq('user_id', user.id)
        .single()
      if (orig) {
        if ((orig as { replied_at?: string | null }).replied_at) {
          return NextResponse.json(
            { error: 'They already replied — no follow-up needed.' },
            { status: 409 }
          )
        }
        if (Number((orig as { followups_sent?: number }).followups_sent ?? 0) >= 2) {
          return NextResponse.json(
            { error: 'Follow-up limit reached for this contact.' },
            { status: 409 }
          )
        }
        inReplyToId = (orig as { message_id?: string }).message_id || undefined
      }
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: gmailAppPassword.replace(/\s+/g, '') },
    })

    const result = await transporter.sendMail({
      from: fromName ? `"${fromName}" <${gmailUser}>` : gmailUser,
      to,
      subject,
      text: body.body,
      html: toHtml(body.body),
      // Thread follow-ups under the original email in the recipient's inbox.
      ...(inReplyToId ? { inReplyTo: inReplyToId, references: inReplyToId } : {}),
    })

    // Durable record + funnel event (best-effort; never blocks the send result).
    const region = getRegion(body.region).id
    let recordId: string | null = null
    if (body.followupOf) {
      // A follow-up updates the original record instead of creating a new one.
      await recordFollowupSent(supabase, user.id, body.followupOf)
      recordId = body.followupOf
    } else {
      recordId = await recordOutreachSend(supabase, user.id, {
        company: body.company,
        role: body.role,
        toEmail: to,
        subject,
        region,
        messageId: result.messageId,
      })
    }
    await logOutreachEvent(supabase, user.id, 'sent', {
      region,
      company: body.company ?? '',
      followup: !!body.followupOf,
    })

    return NextResponse.json({ success: true, messageId: result.messageId, recordId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Send failed'
    // Surface the common Gmail auth failure with a clearer hint.
    const hint = /invalid login|username and password|535|BadCredentials/i.test(message)
      ? 'Gmail rejected the login. Use a 16-character App Password (not your normal password), and make sure 2-Step Verification is on.'
      : message
    console.error('Job outreach send error:', message)
    return NextResponse.json({ error: hint }, { status: 500 })
  }
}
