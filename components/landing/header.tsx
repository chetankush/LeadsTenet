'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Menu, X } from 'lucide-react'

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-black">
          LeadsTeNet
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-gray-600 hover:text-black font-medium">
            Features
          </a>
          <a href="#pricing" className="text-gray-600 hover:text-black font-medium">
            Pricing
          </a>
          <a href="#testimonials" className="text-gray-600 hover:text-black font-medium">
            Testimonials
          </a>
          <Link href="/sign-in" className="text-gray-600 hover:text-black font-medium">
            Sign In
          </Link>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/sign-in">
            <Button
              variant="outline"
              className="font-bold bg-transparent rounded-full border-2 border-black text-black hover:bg-black hover:text-white"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button className="font-bold bg-black text-white hover:bg-gray-800 rounded-full">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-black" />
          ) : (
            <Menu className="h-6 w-6 text-black" />
          )}
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-100 py-4 md:hidden">
            <nav className="container mx-auto px-6 flex flex-col space-y-4">
              <a href="#features" className="text-gray-600 hover:text-black font-medium">
                Features
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-black font-medium">
                Pricing
              </a>
              <a href="#testimonials" className="text-gray-600 hover:text-black font-medium">
                Testimonials
              </a>
              <Link href="/sign-in" className="text-gray-600 hover:text-black font-medium">
                Sign In
              </Link>
              <Link href="/sign-up">
                <Button className="w-full font-bold bg-black text-white hover:bg-gray-800 rounded-full">
                  Get Started
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}