import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { jobOutreachService } from '@/lib/job-outreach-service'
import type { StudentProfile, JobTarget } from '@/lib/job-outreach-service'

interface GenerateRequest {
  student: StudentProfile
  targets: JobTarget[]
}

const MAX_TARGETS = 50

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: GenerateRequest = await request.json()
    const { student, targets } = body

    if (!student?.fullName?.trim()) {
      return NextResponse.json(
        { error: 'Your name is required to generate emails' },
        { status: 400 }
      )
    }

    if (!targets || targets.length === 0) {
      return NextResponse.json({ error: 'Add at least one company to email' }, { status: 400 })
    }

    if (targets.length > MAX_TARGETS) {
      return NextResponse.json(
        { error: `Please generate at most ${MAX_TARGETS} at a time` },
        { status: 400 }
      )
    }

    // Each target needs at least a company + role to personalize around.
    const invalid = targets.find((t) => !t.company?.trim() || !t.role?.trim())
    if (invalid) {
      return NextResponse.json(
        { error: 'Every row needs a company and a role' },
        { status: 400 }
      )
    }

    const emails = await jobOutreachService.generateBatch(student, targets)

    return NextResponse.json({ success: true, emails })
  } catch (error) {
    console.error('Job outreach generate error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    )
  }
}
