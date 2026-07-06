import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * POST /api/contact — landing-page contact form.
 * Validates input and emails it via Resend (if configured).
 */
export async function POST(request: NextRequest) {
  try {
    // Per-IP spam guard (this endpoint is unauthenticated).
    const rl = rateLimit(`contact:${getClientIp(request)}`, 3, 10 * 60_000)
    if (!rl.success) return tooManyRequests(rl)

    const { name, email, message } = await request.json()

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 })
    }
    if (String(message).length > 5000) {
      return NextResponse.json({ error: 'Message is too long.' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    const to = process.env.CONTACT_TO_EMAIL || 'hello@leadstenet.com'

    if (apiKey) {
      const resend = new Resend(apiKey)
      const { error } = await resend.emails.send({
        from: 'LeadsTeNet Contact <onboarding@resend.dev>',
        to: [to],
        replyTo: email,
        subject: `New contact message from ${String(name).slice(0, 100)}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      })
      if (error) {
        console.error('Contact form Resend error:', error)
        return NextResponse.json(
          { error: 'Could not send your message right now. Please email us directly.' },
          { status: 502 }
        )
      }
    } else {
      // No email provider configured (e.g. local dev) — log instead of failing.
      console.warn('RESEND_API_KEY not set; contact message received:', { name, email })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
