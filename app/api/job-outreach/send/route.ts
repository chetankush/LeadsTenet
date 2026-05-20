import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { getAuthUser } from '@/lib/auth-helpers'

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
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

function toHtml(body: string): string {
  const escaped = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  // Linkify bare URLs so résumé/portfolio links are clickable.
  const linked = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1">$1</a>'
  )
  return `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #222;">${linked
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')}</div>`
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    })

    return NextResponse.json({ success: true, messageId: result.messageId })
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
