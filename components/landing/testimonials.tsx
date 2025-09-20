import { Star } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      title: 'VP of Sales, TechCorp',
      content: 'LeadsTeNet transformed our outreach process. We went from 2 hours per campaign to 10 minutes, and our response rate increased by 40%.',
      rating: 5,
      avatar: '/api/placeholder/40/40'
    },
    {
      name: 'Michael Chen',
      title: 'Marketing Director, GrowthCo',
      content: 'The AI personalization is incredible. Each email feels hand-written, and our prospects actually respond because the messages are so relevant.',
      rating: 5,
      avatar: '/api/placeholder/40/40'
    },
    {
      name: 'Emily Rodriguez',
      title: 'Founder, StartupXYZ',
      content: 'As a small startup, LeadsTeNet gave us enterprise-level capabilities. We\'re competing with companies 10x our size thanks to this platform.',
      rating: 5,
      avatar: '/api/placeholder/40/40'
    }
  ]

  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Loved by Sales Teams Worldwide
          </h2>
          <p className="text-xl text-gray-600">
            See what our customers say about their results with LeadsTeNet
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-6 bg-white hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              
              <blockquote className="text-gray-700 mb-6 italic">
                "{testimonial.content}"
              </blockquote>
              
              <div className="flex items-center">
                <div className="bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                  <span className="text-gray-600 font-medium text-sm">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.title}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">95%</div>
            <div className="text-gray-600">Email Deliverability</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-green-600 mb-2">10x</div>
            <div className="text-gray-600">Faster Campaign Setup</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-purple-600 mb-2">40%</div>
            <div className="text-gray-600">Higher Response Rate</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-orange-600 mb-2">1M+</div>
            <div className="text-gray-600">Emails Sent Monthly</div>
          </div>
        </div>
      </div>
    </section>
  )
}