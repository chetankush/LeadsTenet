import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getAuthUser } from '@/lib/auth-helpers'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { logOutreachEvent } from '@/lib/outreach-analytics'
import { RESUME_PROMPT, extractJsonProfile, isUsableProfile } from '@/lib/resume-parse'

export const runtime = 'nodejs'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = rateLimit(`resume-parse:${user.id}`, 5, 60_000)
    if (!rl.success) return tooManyRequests(rl)

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Résumé parsing is not configured' }, { status: 503 })
    }

    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Upload a PDF résumé' }, { status: 400 })
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Please upload a PDF file' }, { status: 400 })
    }
    if (file.size === 0 || file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'PDF must be larger than 0 and at most 5 MB' }, { status: 400 })
    }

    const base64 = Buffer.from(await file.arrayBuffer()).toString('base64')
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    })
    const result = await model.generateContent([
      { inlineData: { mimeType: 'application/pdf', data: base64 } },
      { text: RESUME_PROMPT },
    ])
    const text = (await result.response).text()
    const profile = extractJsonProfile(text)

    if (!isUsableProfile(profile)) {
      return NextResponse.json(
        { error: "Couldn't read that résumé. Try a text-based PDF, or fill in the details manually." },
        { status: 422 }
      )
    }

    await logOutreachEvent(supabase, user.id, 'resume_uploaded', { hasName: !!profile.fullName })

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error('Resume parse error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse résumé' },
      { status: 500 }
    )
  }
}
