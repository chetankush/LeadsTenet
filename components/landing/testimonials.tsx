import { Card } from '@/components/ui/card'
import { Sparkles, Clock, ShieldCheck } from 'lucide-react'

const reasons = [
  {
    icon: Sparkles,
    title: 'Personalized, not blasted',
    description:
      'Every email is generated per lead from their name, company, and industry — so it reads like you wrote it, not a mail merge.',
  },
  {
    icon: Clock,
    title: 'Spreadsheet to sent in minutes',
    description:
      'Upload an Excel file, columns are auto-detected, review the AI drafts, and send — no manual copy-paste.',
  },
  {
    icon: ShieldCheck,
    title: 'Your domain, your reputation',
    description:
      'Verify your own sending domains and stay within sensible rate limits for healthier deliverability.',
  },
]

const capabilities = [
  'AI personalization',
  'Excel import',
  'Domain verification',
  'Usage analytics',
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Built for modern outreach</h2>
          <p className="text-xl text-gray-600">
            What you get with LeadsTeNet — from upload to sent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {reasons.map((reason) => {
            const Icon = reason.icon
            return (
              <Card key={reason.title} className="p-6 bg-white">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{reason.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{reason.description}</p>
              </Card>
            )
          })}
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
          {capabilities.map((cap) => (
            <span
              key={cap}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700"
            >
              {cap}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
