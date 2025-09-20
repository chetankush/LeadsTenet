import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function CTASection() {
  return (
    <section className="py-20 px-6 bg-black text-white">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Lead Generation?</h2>
        <p className="text-xl mb-12 opacity-90">Join professionals who trust LeadsTeNet for their lead management.</p>
        <Link href="/sign-up">
          <Button size="lg" className="font-bold text-lg px-8 py-6 bg-white text-black hover:bg-gray-100 rounded-full">
            Get Started Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </section>
  )
}