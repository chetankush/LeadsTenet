'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Upload, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { DomainSelector, DomainFromEmailInput } from '@/components/dashboard/domain-selector'

export default function NewCampaignPage() {
  const router = useRouter()
  const [campaignName, setCampaignName] = useState('')
  const [campaignDescription, setCampaignDescription] = useState('')
  const [selectedDomainId, setSelectedDomainId] = useState('')
  const [localPart, setLocalPart] = useState('noreply')
  const [fromName, setFromName] = useState('LeadsTeNet')
  const [replyToEmail, setReplyToEmail] = useState('')
  const [loading, setLoading] = useState(false)

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
          reply_to_email: replyToEmail.trim() || null
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