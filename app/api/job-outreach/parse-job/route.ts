import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getAuthUser } from '@/lib/auth-helpers'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { JOB_PARSE_PROMPT, extractJsonJob, isUsableJob } from '@/lib/job-parse'

export const runtime = 'nodejs'

const MAX_CHARS = 20000

/** Extracts company/role/JD/region from pasted job-posting text → an outreach target. */
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = rateLimit(`parse-job:${user.id}`, 15, 60_000)
    if (!rl.success) return tooManyRequests(rl)

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Job parsing is not configured' }, { status: 503 })
    }

    const { text } = (await request.json()) as { text?: string }
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Paste a job posting first' }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    })
    const result = await model.generateContent(`${JOB_PARSE_PROMPT}\n\nJOB POSTING:\n${text.slice(0, MAX_CHARS)}`)
    const job = extractJsonJob((await result.response).text())

    if (!isUsableJob(job)) {
      return NextResponse.json(
        { error: "Couldn't read that posting — paste more of the description." },
        { status: 422 }
      )
    }

    return NextResponse.json({ success: true, job })
  } catch (error) {
    console.error('Parse job error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not parse the posting' },
      { status: 500 }
    )
  }
}
