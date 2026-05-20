import {
  FileSpreadsheet,
  Brain,
  Mail,
  BarChart3,
  Shield,
  Zap,
  Users,
  Target,
} from 'lucide-react'

const features = [
  {
    icon: FileSpreadsheet,
    title: 'Smart Excel Processing',
    description:
      'Upload any Excel file and our AI automatically detects and maps your lead data columns.',
  },
  {
    icon: Brain,
    title: 'AI Personalization',
    description:
      'Generate unique, personalized emails for each lead based on their company and industry.',
  },
  {
    icon: Mail,
    title: 'Bulk Email Sending',
    description:
      'Send thousands of emails with proper rate limiting and deliverability optimization.',
  },
  {
    icon: BarChart3,
    title: 'Campaign Analytics',
    description:
      'Track opens, clicks, and campaign performance with clear, actionable insights.',
  },
  {
    icon: Target,
    title: 'High Deliverability',
    description:
      'Built-in spam prevention and domain reputation management for better inbox placement.',
  },
  {
    icon: Shield,
    title: 'Secure by Design',
    description:
      'Row-level security and encryption keep each tenant’s data fully isolated and private.',
  },
  {
    icon: Users,
    title: 'Custom Domains',
    description:
      'Verify and send from your own domains so every email lands from your brand.',
  },
  {
    icon: Zap,
    title: 'Fast Setup',
    description:
      'Go from spreadsheet to your first personalized campaign in under five minutes.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A complete toolkit to turn a list of leads into personalized outreach that lands.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-md"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
