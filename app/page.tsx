import { LandingHero } from '@/components/landing/hero'
import { FeaturesSection } from '@/components/landing/features'
import { PricingSection } from '@/components/landing/pricing'
import { TestimonialsSection } from '@/components/landing/testimonials'
import { CTASection } from '@/components/landing/cta'
import { LandingHeader } from '@/components/landing/header'
import { LandingFooter } from '@/components/landing/footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <LandingHeader />
      <main>
        <LandingHero />
        <FeaturesSection />
        <PricingSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  )
}
