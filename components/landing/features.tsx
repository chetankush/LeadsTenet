import { 
  FileSpreadsheet, 
  Brain, 
  Mail, 
  BarChart3, 
  Shield, 
  Zap,
  Users,
  Target
} from 'lucide-react'

export function FeaturesSection() {
  const features = [
    {
      icon: FileSpreadsheet,
      title: 'Smart Excel Processing',
      description: 'Upload any Excel file and our AI automatically detects and maps lead data columns.',
    },
    {
      icon: Brain,
      title: 'AI Personalization',
      description: 'Generate unique, personalized emails for each lead based on their company and industry.',
    },
    {
      icon: Mail,
      title: 'Bulk Email Sending',
      description: 'Send thousands of emails with proper rate limiting and deliverability optimization.',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Track opens, clicks, responses, and campaign performance with detailed insights.',
    }
  ]

  return (
    <section id="features" className="py-20 px-6">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl font-bold text-center text-black mb-16">Everything You Need</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Smart Excel Processing Card - Red gradient */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 to-red-600 p-8 text-white">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="relative z-10">
              <FileSpreadsheet className="h-8 w-8 mb-6" />
              <h3 className="text-xl font-bold mb-4">Smart Excel Processing</h3>
              <p className="text-white/90">Upload any Excel file and our AI automatically detects and maps lead data columns.</p>
            </div>
          </div>

          {/* AI Personalization Card - Blue gradient */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 p-8 text-white">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="relative z-10">
              <Brain className="h-8 w-8 mb-6" />
              <h3 className="text-xl font-bold mb-4">AI Personalization</h3>
              <p className="text-white/90">Generate unique, personalized emails for each lead based on their company and industry.</p>
            </div>
          </div>

          {/* Bulk Email Sending Card - Purple gradient */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 to-purple-700 p-8 text-white">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="relative z-10">
              <Mail className="h-8 w-8 mb-6" />
              <h3 className="text-xl font-bold mb-4">Bulk Email Sending</h3>
              <p className="text-white/90">Send thousands of emails with proper rate limiting and deliverability optimization.</p>
            </div>
          </div>

          {/* Advanced Analytics Card - Green gradient */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 to-green-700 p-8 text-white">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="relative z-10">
              <BarChart3 className="h-8 w-8 mb-6" />
              <h3 className="text-xl font-bold mb-4">Advanced Analytics</h3>
              <p className="text-white/90">Track opens, clicks, responses, and campaign performance with detailed insights.</p>
            </div>
          </div>
        </div>

        {/* Additional Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 to-orange-700 p-8 text-white">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="relative z-10">
              <Target className="h-8 w-8 mb-6" />
              <h3 className="text-xl font-bold mb-4">High Deliverability</h3>
              <p className="text-white/90">Built-in spam prevention and domain reputation management for better inbox placement.</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-600 to-gray-700 p-8 text-white">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="relative z-10">
              <Shield className="h-8 w-8 mb-6" />
              <h3 className="text-xl font-bold mb-4">Enterprise Security</h3>
              <p className="text-white/90">SOC 2 compliant with encryption at rest and in transit. Your data is always secure.</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 text-white">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="relative z-10">
              <Users className="h-8 w-8 mb-6" />
              <h3 className="text-xl font-bold mb-4">Team Collaboration</h3>
              <p className="text-white/90">Share campaigns with team members and manage permissions for seamless workflow.</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-600 to-yellow-700 p-8 text-white">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="relative z-10">
              <Zap className="h-8 w-8 mb-6" />
              <h3 className="text-xl font-bold mb-4">API Integration</h3>
              <p className="text-white/90">Integrate with your existing CRM and tools using our comprehensive REST API.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}