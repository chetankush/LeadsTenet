'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Upload, Mail, FileText, CheckCircle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { DomainSelector, DomainFromEmailInput } from '@/components/dashboard/domain-selector'
import type { EmailTemplate } from '@/lib/types/template'

export default function NewCampaignPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('template')

  const [campaignName, setCampaignName] = useState('')
  const [campaignDescription, setCampaignDescription] = useState('')
  const [selectedDomainId, setSelectedDomainId] = useState('')
  const [localPart, setLocalPart] = useState('noreply')
  const [fromName, setFromName] = useState('LeadsTeNet')
  const [replyToEmail, setReplyToEmail] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check for template from URL param or session storage
    const loadTemplate = async () => {
      if (templateId) {
        try {
          const response = await fetch(`/api/templates/${templateId}`)
          const data = await response.json()
          if (data.success && data.template) {
            setSelectedTemplate(data.template)
          }
        } catch (error) {
          console.error('Error loading template:', error)
        }
      } else {
        // Check session storage
        const storedTemplate = sessionStorage.getItem('selectedTemplate')
        if (storedTemplate) {
          try {
            setSelectedTemplate(JSON.parse(storedTemplate))
            sessionStorage.removeItem('selectedTemplate')
          } catch (error) {
            console.error('Error parsing stored template:', error)
          }
        }
      }
    }
    loadTemplate()
  }, [templateId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!campaignName.trim()) {
      toast.error('Campaign name is required')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName.trim(),
          description: campaignDescription.trim() || null,
          domain_id: selectedDomainId || null,
          local_part: localPart.trim(),
          from_name: fromName.trim(),
          reply_to_email: replyToEmail.trim() || null,
          template_id: selectedTemplate?.id || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create campaign')
      }

      const result = await response.json()
      toast.success('Campaign created successfully!')
      
      // Redirect to campaigns list or the new campaign detail page
      router.push('/dashboard/campaigns')
      
    } catch (error) {
      console.error('Error creating campaign:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
          <p className="text-gray-600 mt-2">Set up a new email campaign</p>
        </div>
      </div>

      {/* Template Selection Banner */}
      {selectedTemplate ? (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-green-900">{selectedTemplate.name}</h3>
                  {selectedTemplate.is_system && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Pre-built
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-green-700">
                  {selectedTemplate.description || `Template ready for ${selectedTemplate.scenario}`}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedTemplate.mood_tags.slice(0, 3).map(mood => (
                    <Badge key={mood} variant="outline" className="text-xs bg-white">
                      {mood}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push('/dashboard/templates')}
              >
                Change
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedTemplate(null)}
                className="text-red-600 hover:text-red-700"
              >
                Remove
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">No template selected</h3>
              <p className="text-sm text-blue-700 mt-1">
                Start with a pre-built template to save time and ensure consistency
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => router.push('/dashboard/templates')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Browse Templates
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name *
            </label>
            <input
              type="text"
              id="name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter campaign name..."
              required
            />
          </div>

          {/* Campaign Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={campaignDescription}
              onChange={(e) => setCampaignDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your campaign..."
            />
          </div>

          {/* Email Configuration */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Settings</h3>

            <div className="space-y-4">
              {/* Domain Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sending Domain
                </label>
                <DomainSelector
                  value={selectedDomainId}
                  onValueChange={setSelectedDomainId}
                  placeholder="Select domain for sending emails..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Choose a verified custom domain or leave empty to use the default Resend domain
                </p>
              </div>

              {/* From Email Configuration */}
              {selectedDomainId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Email Address
                  </label>
                  <DomainFromEmailInput
                    domainId={selectedDomainId}
                    localPart={localPart}
                    onLocalPartChange={setLocalPart}
                  />
                </div>
              )}

              {/* From Name */}
              <div>
                <label htmlFor="fromName" className="block text-sm font-medium text-gray-700 mb-2">
                  From Name
                </label>
                <input
                  type="text"
                  id="fromName"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your Name or Company"
                />
              </div>

              {/* Reply-To Email */}
              <div>
                <label htmlFor="replyToEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Reply-To Email (Optional)
                </label>
                <input
                  type="email"
                  id="replyToEmail"
                  value={replyToEmail}
                  onChange={(e) => setReplyToEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="replies@yourcompany.com"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>Creating...</>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Create Campaign
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Next Steps */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <Upload className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Next Step: Upload Leads</h3>
            <p className="text-blue-700 text-sm mt-1">
              After creating your campaign, you'll need to upload leads to start sending emails. 
              You can do this from the campaigns list or the upload page.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}