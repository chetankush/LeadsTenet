'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Play, FileSpreadsheet, Brain, Mail } from 'lucide-react'
import Link from 'next/link'

export function LandingHero() {
  return (
    <section className="py-24 px-6">
      <div className="container mx-auto max-w-4xl text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-black mb-6 text-balance">
          Excel → AI →
          <br />
          Personalized Emails.
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto text-pretty">
          Upload your Excel leads, let AI create personalized emails, 
          and send thousands of targeted campaigns in minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/sign-up">
            <Button
              size="lg"
              className="font-bold text-lg px-8 py-6 bg-black text-white hover:bg-gray-800 rounded-full"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          
          <Button
            asChild
            variant="outline"
            size="lg"
            className="font-bold text-lg px-8 py-6 bg-transparent border-2 border-black text-black hover:bg-black hover:text-white rounded-full"
          >
            <a href="#features">
              <Play className="mr-2 h-5 w-5" />
              See How It Works
            </a>
          </Button>
        </div>
      </div>

      {/* Process Flow - Three Simple Steps */}
      <div className="container mx-auto max-w-4xl mt-20">
        <h2 className="text-4xl font-bold text-center text-black mb-16">Three Simple Steps</h2>
        <div className="space-y-16">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Upload Excel</h3>
              <p className="text-lg text-gray-600">
                Drag & drop your Excel file with lead data. We'll automatically detect columns and map your data.
              </p>
            </div>
            <div className="flex-1 bg-gray-50 rounded-3xl p-8 min-h-[200px] flex items-center justify-center">
              <FileSpreadsheet className="h-24 w-24 text-gray-400" />
            </div>
          </div>

          <div className="flex flex-col md:flex-row-reverse items-center gap-12">
            <div className="flex-1">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">AI Personalizes</h3>
              <p className="text-lg text-gray-600">
                Advanced AI creates unique, personalized emails for each lead based on their company and industry.
              </p>
            </div>
            <div className="flex-1 bg-gray-50 rounded-3xl p-8 min-h-[200px] flex items-center justify-center">
              <Brain className="h-24 w-24 text-gray-400" />
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Send & Track</h3>
              <p className="text-lg text-gray-600">
                Send bulk emails with rate limiting and track opens, clicks, and responses in real-time.
              </p>
            </div>
            <div className="flex-1 bg-gray-50 rounded-3xl p-8 min-h-[200px] flex items-center justify-center">
              <Mail className="h-24 w-24 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}