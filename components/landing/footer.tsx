import Link from 'next/link'
import { Mail, MapPin, Phone, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContactForm } from '@/components/landing/contact-form'

export function LandingFooter() {
  return (
    <>
      {/* Contact Section */}
      <section id="contact" className="py-20 px-6 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold text-center text-black mb-16">Get In Touch</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-black mb-6">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-black">Phone</p>
                    <p className="text-gray-600">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-black">Email</p>
                    <p className="text-gray-600">hello@leadstenet.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-black">Address</p>
                    <p className="text-gray-600">
                      123 Business Ave, Suite 100
                      <br />
                      New York, NY 10001
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-8">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-gray-100">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold text-black mb-4">LeadsTeNet</div>
              <p className="text-gray-600">Excel → AI → Emails. Transform your lead generation process.</p>
            </div>
            <div>
              <h4 className="font-bold text-black mb-4">Product</h4>
              <div className="space-y-2">
                <a href="#features" className="block text-gray-600 hover:text-black">
                  Features
                </a>
                <a href="#pricing" className="block text-gray-600 hover:text-black">
                  Pricing
                </a>
                <Link href="/sign-up" className="block text-gray-600 hover:text-black">
                  Get Started
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-black mb-4">Company</h4>
              <div className="space-y-2">
                <a href="#contact" className="block text-gray-600 hover:text-black">
                  About
                </a>
                <a href="#contact" className="block text-gray-600 hover:text-black">
                  Blog
                </a>
                <a href="#contact" className="block text-gray-600 hover:text-black">
                  Careers
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-black mb-4">Support</h4>
              <div className="space-y-2">
                <a href="#contact" className="block text-gray-600 hover:text-black">
                  Help Center
                </a>
                <a href="#contact" className="block text-gray-600 hover:text-black">
                  Contact
                </a>
                <a href="#contact" className="block text-gray-600 hover:text-black">
                  Status
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 mb-4 md:mb-0">© 2026 LeadsTeNet. All rights reserved.</p>
            <div className="flex gap-8 text-gray-600">
              <a href="#contact" className="hover:text-black">
                Privacy Policy
              </a>
              <a href="#contact" className="hover:text-black">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Chatbot Icon */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button className="w-14 h-14 rounded-full bg-black text-white hover:bg-gray-800 shadow-lg">
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    </>
  )
}