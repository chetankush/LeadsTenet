import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * Job Outreach Service
 *
 * Generates personalized cold emails from a student/job-seeker to a specific
 * HR contact / recruiter / hiring manager. This is intentionally separate from
 * the sales-oriented `ai-service.ts`: the goal here is a credible, specific job
 * application — not a sales pitch — and it is designed to be sent from the
 * student's OWN mailbox at low volume (no warmup/rotation infrastructure needed).
 */

export interface StudentProfile {
  fullName: string
  university?: string
  degree?: string
  gradYear?: string
  skills?: string // comma separated or free text
  achievement?: string // one standout project / internship / number
  resumeLink?: string
  portfolioLink?: string
  phone?: string
  extra?: string // anything else worth mentioning
}

export interface JobTarget {
  id: string
  company: string
  role: string // role / position the student is targeting
  hrName?: string // HR / recruiter / hiring manager name (optional)
  hrEmail: string
  jobDescription?: string // pasted JD text greatly improves matching
}

export interface GeneratedJobEmail {
  targetId: string
  subject: string
  body: string
  error?: string
}

export class JobOutreachService {
  private gemini: GoogleGenerativeAI
  private model: any

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required')
    }
    this.gemini = new GoogleGenerativeAI(apiKey)
    this.model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' })
  }

  /** Generate a personalized job-application email for a single target. */
  generateEmail = async (
    student: StudentProfile,
    target: JobTarget
  ): Promise<GeneratedJobEmail> => {
    const prompt = this.buildPrompt(student, target)

    try {
      const result = await this.model.generateContent(prompt)
      const text = (await result.response).text()
      const parsed = this.parse(text)
      return {
        targetId: target.id,
        subject: parsed.subject || `Application for ${target.role} — ${student.fullName}`,
        body: parsed.body || this.fallbackBody(student, target),
      }
    } catch (error) {
      console.error(`Job email generation failed for ${target.company}:`, error)
      return {
        targetId: target.id,
        subject: `Application for ${target.role} — ${student.fullName}`,
        body: this.fallbackBody(student, target),
        error: error instanceof Error ? error.message : 'Generation failed',
      }
    }
  }

  /** Generate emails for many targets (sequential — student volumes are small). */
  generateBatch = async (
    student: StudentProfile,
    targets: JobTarget[]
  ): Promise<GeneratedJobEmail[]> => {
    const out: GeneratedJobEmail[] = []
    for (const target of targets) {
      out.push(await this.generateEmail(student, target))
    }
    return out
  }

  private buildPrompt = (student: StudentProfile, target: JobTarget): string => {
    const studentInfo = [
      `- Name: ${student.fullName}`,
      student.degree && `- Degree/Field: ${student.degree}`,
      student.university && `- University: ${student.university}`,
      student.gradYear && `- Graduation year: ${student.gradYear}`,
      student.skills && `- Key skills: ${student.skills}`,
      student.achievement && `- Standout achievement/project: ${student.achievement}`,
      student.extra && `- Other context: ${student.extra}`,
    ]
      .filter(Boolean)
      .join('\n')

    return `You are helping a student/early-career candidate write a SHORT, personalized cold email to a recruiter/hiring manager to be considered for a specific role.

CANDIDATE:
${studentInfo}

TARGET:
- Company: ${target.company}
- Role they want: ${target.role}
${target.hrName ? `- Recipient name: ${target.hrName}` : '- Recipient name: (unknown — use a polite neutral greeting like "Hi there,")'}
${target.jobDescription ? `\nJOB DESCRIPTION (use this to match the candidate's skills to real requirements):\n${target.jobDescription}` : ''}

STRICT REQUIREMENTS:
- Under 130 words. Plain, warm, human tone. NOT salesy.
- Open with the recipient's name if known, otherwise a neutral greeting.
- Name the SPECIFIC role "${target.role}" and the company "${target.company}".
- Give ONE concrete reason the candidate fits, mapped to the role's requirements${target.jobDescription ? ' (use the job description)' : ''}.
- Mention ONE real proof point (a project, internship, skill, or number) from the candidate info.
- Make a clear, low-friction ask (e.g., to be considered / a quick chat / whether the role is open).
${student.resumeLink ? `- Mention the résumé is attached/linked: ${student.resumeLink}` : '- Do NOT invent a résumé link.'}
- Sign off with the candidate's real name${student.phone ? ` and phone ${student.phone}` : ''}.
- NO placeholders like [Your Name], [Company], [skill]. Use the real values above.
- Do NOT fabricate facts about the candidate or company.

Return ONLY valid JSON:
{"subject": "...", "body": "..."}`
  }

  private parse = (text: string): { subject?: string; body?: string } => {
    try {
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        return { subject: parsed.subject, body: parsed.body }
      }
    } catch (error) {
      console.error('Failed to parse job email JSON:', error)
    }
    return {}
  }

  private fallbackBody = (student: StudentProfile, target: JobTarget): string => {
    const greeting = target.hrName ? `Hi ${target.hrName},` : 'Hi there,'
    const skillLine = student.skills ? ` with a background in ${student.skills}` : ''
    const proof = student.achievement ? ` Recently, ${student.achievement}.` : ''
    const resume = student.resumeLink ? `\n\nRésumé: ${student.resumeLink}` : ''
    return `${greeting}

I'm ${student.fullName}${student.degree ? `, a ${student.degree} student` : ''}${student.university ? ` at ${student.university}` : ''}${skillLine}. I'm very interested in the ${target.role} role at ${target.company}.${proof}

Would you be open to considering my application, or pointing me to the right person? I'd appreciate the chance to contribute.${resume}

Thank you for your time,
${student.fullName}${student.phone ? `\n${student.phone}` : ''}`
  }
}

export const jobOutreachService = new JobOutreachService()
