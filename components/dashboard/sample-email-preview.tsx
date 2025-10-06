"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Sparkles, RefreshCw, Mail, User, Building2, Briefcase, Eye } from 'lucide-react'

interface SampleEmailData {
  lead: {
    name: string
    email: string
    company: string
    industry: string
  }
  email: {
    subject: string
    body: string
    tone: string
    callToAction: string
  }
  generatedAt: string
}

export function SampleEmailPreview() {
  const [loading, setLoading] = useState(false)
  const [sampleData, setSampleData] = useState<SampleEmailData | null>(null)
  const [showCustomInput, setShowCustomInput] = useState(false)

  // Custom lead data
  const [customLead, setCustomLead] = useState({
    name: 'John Smith',
    email: 'john.smith@example.com',
    company: 'Acme Corporation',
    industry: 'Technology'
  })

  const generateSampleEmail = async (useCustomData = false) => {
    setLoading(true)
    try {
      const response = await fetch('/api/sample-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadData: useCustomData ? customLead : null
        })
      })

      const data = await response.json()

      if (data.success) {
        setSampleData(data.sample)
        toast.success('Sample email generated!')
      } else {
        toast.error(data.error || 'Failed to generate sample email')
      }
    } catch (error) {
      toast.error('Error generating sample email')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              AI Email Preview
            </CardTitle>
            <CardDescription>
              See how our AI personalizes emails for your leads
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomInput(!showCustomInput)}
            >
              <User className="h-4 w-4 mr-2" />
              {showCustomInput ? 'Use Default' : 'Customize'}
            </Button>
            <Button
              onClick={() => generateSampleEmail(showCustomInput)}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Generate Sample
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Custom Lead Input */}
        {showCustomInput && (
          <Card className="bg-white border-blue-200">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Lead Name</Label>
                  <Input
                    id="name"
                    value={customLead.name}
                    onChange={(e) => setCustomLead({ ...customLead, name: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customLead.email}
                    onChange={(e) => setCustomLead({ ...customLead, email: e.target.value })}
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={customLead.company}
                    onChange={(e) => setCustomLead({ ...customLead, company: e.target.value })}
                    placeholder="Acme Corporation"
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={customLead.industry}
                    onChange={(e) => setCustomLead({ ...customLead, industry: e.target.value })}
                    placeholder="Technology"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sample Email Display */}
        {!sampleData && !loading && (
          <div className="text-center py-12 border-2 border-dashed border-blue-200 rounded-lg bg-white/50">
            <Mail className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              See AI Personalization in Action
            </h3>
            <p className="text-gray-500 mb-4">
              Click "Generate Sample" to see how AI crafts personalized emails
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12 border-2 border-dashed border-blue-200 rounded-lg bg-white/50">
            <RefreshCw className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              AI is Crafting Your Email...
            </h3>
            <p className="text-gray-500">
              Using Gemini AI to personalize content
            </p>
          </div>
        )}

        {sampleData && !loading && (
          <div className="space-y-4">
            {/* Lead Info */}
            <Card className="bg-white border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Sample Lead Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm font-medium">{sampleData.lead.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium">{sampleData.lead.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">Company</p>
                      <p className="text-sm font-medium">{sampleData.lead.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">Industry</p>
                      <p className="text-sm font-medium">{sampleData.lead.industry}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generated Email */}
            <Card className="bg-white border-2 border-blue-300 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Generated Personalized Email</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        AI Generated
                      </Badge>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {sampleData.email.tone}
                      </Badge>
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => generateSampleEmail(showCustomInput)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Email Preview */}
                <div className="space-y-4">
                  {/* Subject Line */}
                  <div>
                    <Label className="text-xs text-gray-500 uppercase">Subject</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="font-semibold text-gray-900">{sampleData.email.subject}</p>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div>
                    <Label className="text-xs text-gray-500 uppercase">Email Body</Label>
                    <div className="mt-1 p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200">
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-gray-900 leading-relaxed">
                          {sampleData.email.body}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div>
                    <Label className="text-xs text-gray-500 uppercase">Call to Action</Label>
                    <div className="mt-1 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900 font-medium">
                        {sampleData.email.callToAction}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Generated Timestamp */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Generated at {new Date(sampleData.generatedAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">
                    This is how every email will be personalized
                  </h4>
                  <p className="text-sm text-blue-700">
                    Each lead in your campaign gets a unique, AI-generated email based on their
                    company, industry, and any additional data you provide. The AI ensures every
                    message sounds natural and human-written.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
