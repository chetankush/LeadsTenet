"use client"

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download, ChevronRight, ChevronDown, User } from 'lucide-react'
import { toast } from 'sonner'

interface LeadData {
  name?: string
  email?: string
  company?: string
  industry?: string
  [key: string]: any
}

interface ProcessedData {
  leads: LeadData[]
  errors: string[]
  totalRows: number
  validRows: number
}

interface ProcessingResult {
  success: boolean
  campaignId?: string
  aiResponse?: any
  emailResults?: any
  summary?: {
    totalLeads: number
    aiProcessed: number
    emailsSent: number
    totalErrors: number
  }
}

const EnhancedExcelUploadPage = () => {
  const router = useRouter()
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'ai-processing' | 'sending-emails' | 'success' | 'error'>('idle')
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null)
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [currentStep, setCurrentStep] = useState<string>('')

  // Campaign details
  const [campaignName, setCampaignName] = useState<string>('')
  const [campaignDescription, setCampaignDescription] = useState<string>('')

  // Email preview
  const [previewEmails, setPreviewEmails] = useState<any[]>([])
  const [pendingCampaignId, setPendingCampaignId] = useState<string | null>(null)

  // Wizard step
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Sender context (pre-filled from settings)
  const [senderContext, setSenderContext] = useState({
    senderName: '',
    senderRole: '',
    companyName: '',
    productDescription: '',
    valueProposition: '',
    tone: 'friendly' as 'friendly' | 'professional' | 'casual' | 'bold',
    customInstructions: ''
  })
  const [showSenderSettings, setShowSenderSettings] = useState(false)

  // Fetch default sender context from settings on mount
  useEffect(() => {
    const fetchDefaults = async () => {
      try {
        const res = await fetch('/api/user/settings')
        if (res.ok) {
          const data = await res.json()
          const bp = data.settings?.businessProfile
          if (bp) {
            setSenderContext({
              senderName: bp.senderName || '',
              senderRole: bp.senderRole || '',
              companyName: bp.companyName || '',
              productDescription: bp.productDescription || '',
              valueProposition: bp.valueProposition || '',
              tone: bp.defaultTone || 'friendly',
              customInstructions: bp.customInstructions || '',
            })
          }
        }
      } catch (e) { /* silent fail, user fills manually */ }
    }
    fetchDefaults()
  }, [])

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Process uploaded file (Excel or CSV) and extract data
  const processFile = useCallback(async (file: File) => {
    setUploadStatus('processing')
    setFileName(file.name)

    try {
      let headers: string[] = []
      let dataRows: any[][] = []

      const fileExtension = file.name.split('.').pop()?.toLowerCase()

      if (fileExtension === 'csv') {
        // Parse CSV using PapaParse
        const text = await file.text()
        const parsed = Papa.parse<string[]>(text, { header: false, skipEmptyLines: true })

        if (parsed.data.length === 0) {
          throw new Error('CSV file is empty')
        }

        headers = parsed.data[0].map((h: string) => h?.toString() ?? '')
        dataRows = parsed.data.slice(1)
      } else {
        // Parse Excel using XLSX
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })

        // Get first sheet
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]

        // Convert to JSON with header mapping
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: ''
        })

        if (jsonData.length === 0) {
          throw new Error('Excel file is empty')
        }

        headers = (jsonData[0] as any[]).map((h: any) => h?.toString() ?? '')
        dataRows = jsonData.slice(1) as any[][]
      }

      // Get headers and normalize them
      const normalizedHeaders = headers.map(h => h?.toString().toLowerCase().trim())

      // Find column indices for required fields
      const nameIndex = normalizedHeaders.findIndex(h =>
        h.includes('name') || h.includes('full name') || h.includes('fullname')
      )
      const emailIndex = normalizedHeaders.findIndex(h =>
        h.includes('email') || h.includes('e-mail') || h.includes('email address')
      )
      const companyIndex = normalizedHeaders.findIndex(h =>
        h.includes('company') || h.includes('organization') || h.includes('business')
      )
      const industryIndex = normalizedHeaders.findIndex(h =>
        h.includes('industry') || h.includes('sector') || h.includes('field')
      )

      const leads: LeadData[] = []
      const errors: string[] = []

      // Process data rows
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] as any[]

        // Skip empty rows
        if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
          continue
        }

        const lead: LeadData = {}

        // Extract data based on column indices
        if (nameIndex >= 0 && row[nameIndex]) {
          lead.name = row[nameIndex].toString().trim()
        }

        if (emailIndex >= 0 && row[emailIndex]) {
          const email = row[emailIndex].toString().trim()
          lead.email = email
        }

        if (companyIndex >= 0 && row[companyIndex]) {
          lead.company = row[companyIndex].toString().trim()
        }

        if (industryIndex >= 0 && row[industryIndex]) {
          lead.industry = row[industryIndex].toString().trim()
        }

        // Add all other columns as additional data
        headers.forEach((header, index) => {
          if (index !== nameIndex && index !== emailIndex &&
              index !== companyIndex && index !== industryIndex &&
              row[index]) {
            const key = header.toLowerCase().replace(/\s+/g, '_')
            lead[key] = row[index].toString().trim()
          }
        })

        // Validation (i is 0-based in dataRows, +2 for 1-based index + header row)
        if (!lead.name || !lead.email) {
          errors.push(`Row ${i + 2}: Missing required fields (Name or Email)`)
          continue
        }

        if (!isValidEmail(lead.email)) {
          errors.push(`Row ${i + 2}: Invalid email format - ${lead.email}`)
          continue
        }

        leads.push(lead)
      }

      const processed: ProcessedData = {
        leads,
        errors,
        totalRows: dataRows.length,
        validRows: leads.length
      }

      setProcessedData(processed)
      setUploadStatus('idle')

    } catch (error) {
      console.error('Error processing file:', error)
      toast.error('Error processing file')
      setUploadStatus('error')
    }
  }, [])

  // Complete processing flow with database campaign creation
  const processCompleteFlow = async () => {
    if (!processedData) return

    try {
      // Step 1: Create campaign and upload leads
      setCurrentStep('Creating campaign and uploading leads...')
      setUploadStatus('processing')

      const campaignResponse = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          description: campaignDescription,
          leads: processedData.leads,
          from_email: 'onboarding@resend.dev',
          from_name: senderContext.companyName || campaignName || 'LeadsTeNet',
          sender_context: senderContext
        })
      })

      if (!campaignResponse.ok) {
        const errorData = await campaignResponse.json()
        throw new Error(errorData.error || 'Failed to create campaign')
      }

      const campaignData = await campaignResponse.json()

      // Step 2: Process with AI (without sending)
      setCurrentStep('Generating AI-personalized content...')
      setUploadStatus('ai-processing')

      const processingResponse = await fetch('/api/process-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaignData.campaign.id,
          sendEmails: false,
          senderContext: senderContext
        })
      })

      if (!processingResponse.ok) {
        const errorData = await processingResponse.json()
        throw new Error(errorData.error || 'Failed to process campaign')
      }

      const result = await processingResponse.json()

      // Show preview inline on step 3
      setPendingCampaignId(campaignData.campaign.id)
      const sampleEmails = (result.aiResults?.processedLeads || []).slice(0, 3)
      setPreviewEmails(sampleEmails)
      setCurrentStep('AI processing complete. Review emails before sending.')
      setUploadStatus('idle')
      setStep(3)

      // Store result for later
      setProcessingResult({
        success: true,
        campaignId: campaignData.campaign.id,
        ...result
      })

    } catch (error) {
      console.error('Processing error:', error)
      toast.error(error instanceof Error ? error.message : 'Processing failed')
      setCurrentStep(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setUploadStatus('error')
    }
  }

  // Send emails after preview confirmation
  const handleConfirmSend = async () => {
    if (!pendingCampaignId) return

    try {
      setCurrentStep('Sending emails...')
      setUploadStatus('sending-emails')

      const sendResponse = await fetch('/api/process-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: pendingCampaignId,
          sendEmails: true,
          senderContext: senderContext
        })
      })

      if (!sendResponse.ok) {
        const errorData = await sendResponse.json()
        throw new Error(errorData.error || 'Failed to send emails')
      }

      const result = await sendResponse.json()

      setProcessingResult(prev => ({
        ...prev,
        success: true,
        campaignId: pendingCampaignId,
        ...result
      }))

      setCurrentStep('Complete!')
      setUploadStatus('success')
      toast.success('Emails sent successfully!')
    } catch (error) {
      console.error('Send error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send emails')
      setUploadStatus('error')
    }
  }

  const handleSkipSend = () => {
    setUploadStatus('success')
    toast.success('Campaign created! Emails not sent yet.')
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      processFile(file)
    }
  }, [processFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1
  })

  const handleViewCampaign = () => {
    if (processingResult?.campaignId) {
      router.push(`/dashboard/campaigns/${processingResult.campaignId}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Campaign</h1>
          <p className="text-gray-600 mt-2">Create a new campaign by uploading your leads and letting AI craft personalized emails</p>
        </div>
        <a href="/sample-leads.csv" download="sample-leads.csv">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download Sample CSV
          </Button>
        </a>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        {[
          { num: 1, label: 'Campaign Setup' },
          { num: 2, label: 'Upload Leads' },
          { num: 3, label: 'Preview & Send' }
        ].map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors",
                step > s.num ? "bg-green-500 border-green-500 text-white" :
                step === s.num ? "bg-blue-600 border-blue-600 text-white" :
                "bg-white border-gray-300 text-gray-400"
              )}>
                {step > s.num ? <CheckCircle className="h-5 w-5" /> : s.num}
              </div>
              <span className={cn(
                "text-xs mt-1 font-medium",
                step >= s.num ? "text-gray-900" : "text-gray-400"
              )}>{s.label}</span>
            </div>
            {i < 2 && <div className={cn("w-20 h-0.5 mx-2 mb-5", step > s.num ? "bg-green-500" : "bg-gray-300")} />}
          </div>
        ))}
      </div>

      {/* ===== STEP 1: Campaign Setup ===== */}
      {step === 1 && (
        <>
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Campaign Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Enter campaign name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={campaignDescription}
                  onChange={(e) => setCampaignDescription(e.target.value)}
                  placeholder="Describe your campaign..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>

          {/* Collapsible Sender & AI Settings */}
          <Card className="p-6">
            <button
              type="button"
              onClick={() => setShowSenderSettings(!showSenderSettings)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <h2 className="text-lg font-semibold">Sender & AI Settings</h2>
                  {!showSenderSettings && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {senderContext.senderName && senderContext.companyName
                        ? `Sending as: ${senderContext.senderName} at ${senderContext.companyName}`
                        : 'Set up your sender profile for better emails'}
                    </p>
                  )}
                </div>
              </div>
              {showSenderSettings ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {showSenderSettings && (
              <div className="mt-6 space-y-6">
                {/* Name, Role, Company - 3 column grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={senderContext.senderName}
                      onChange={(e) => setSenderContext(prev => ({ ...prev, senderName: e.target.value }))}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Role
                    </label>
                    <input
                      type="text"
                      value={senderContext.senderRole}
                      onChange={(e) => setSenderContext(prev => ({ ...prev, senderRole: e.target.value }))}
                      placeholder="e.g. Founder, Sales Director"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={senderContext.companyName}
                      onChange={(e) => setSenderContext(prev => ({ ...prev, companyName: e.target.value }))}
                      placeholder="Acme Inc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* What you offer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What do you offer?
                  </label>
                  <textarea
                    value={senderContext.productDescription}
                    onChange={(e) => setSenderContext(prev => ({ ...prev, productDescription: e.target.value }))}
                    rows={2}
                    placeholder="e.g. We help SaaS companies automate their outbound sales with AI-powered email campaigns."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Key benefit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key benefit for prospects
                  </label>
                  <textarea
                    value={senderContext.valueProposition}
                    onChange={(e) => setSenderContext(prev => ({ ...prev, valueProposition: e.target.value }))}
                    rows={2}
                    placeholder="e.g. Our clients typically see 3x more replies and save 10 hours per week on outreach."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Tone dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tone
                  </label>
                  <select
                    value={senderContext.tone}
                    onChange={(e) => setSenderContext(prev => ({ ...prev, tone: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="friendly">Friendly</option>
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>

                {/* Custom Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom AI Instructions (optional)
                  </label>
                  <textarea
                    value={senderContext.customInstructions}
                    onChange={(e) => setSenderContext(prev => ({ ...prev, customInstructions: e.target.value }))}
                    rows={2}
                    placeholder="e.g. Always mention our free trial. Never use the word 'innovative'."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Next button */}
          <div className="flex justify-end">
            <Button
              onClick={() => setStep(2)}
              disabled={!campaignName.trim()}
              className="px-6"
            >
              Next: Upload Leads
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      {/* ===== STEP 2: Upload Leads ===== */}
      {step === 2 && (
        <>
          {/* Processing indicator (shown during AI processing) */}
          {(uploadStatus === 'processing' || uploadStatus === 'ai-processing' || uploadStatus === 'sending-emails') && (
            <Card className="p-6">
              <div className="text-center">
                <div className="mb-4">
                  {uploadStatus === 'processing' && <Upload className="mx-auto h-12 w-12 text-blue-500 animate-spin" />}
                  {uploadStatus === 'ai-processing' && <AlertCircle className="mx-auto h-12 w-12 text-purple-500 animate-pulse" />}
                  {uploadStatus === 'sending-emails' && <FileText className="mx-auto h-12 w-12 text-green-500 animate-pulse" />}
                </div>

                <p className="text-lg font-medium">
                  {uploadStatus === 'processing' && `Processing ${fileName}...`}
                  {uploadStatus === 'ai-processing' && `Generating AI content...`}
                  {uploadStatus === 'sending-emails' && `Sending emails...`}
                </p>
                <p className="text-gray-500">{currentStep}</p>

                <div className="mt-4 space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 bg-blue-500 rounded-full transition-all duration-500 ${
                      uploadStatus === 'processing' ? 'w-1/3' :
                      uploadStatus === 'ai-processing' ? 'w-2/3' :
                      uploadStatus === 'sending-emails' ? 'w-full' : 'w-0'
                    }`}></div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {uploadStatus === 'processing' && 'Step 1/3: Creating campaign and processing file'}
                    {uploadStatus === 'ai-processing' && 'Step 2/3: Generating personalized content with AI'}
                    {uploadStatus === 'sending-emails' && 'Step 3/3: Sending emails to leads'}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Upload Area (shown when idle or error, not during processing) */}
          {(uploadStatus === 'idle' || uploadStatus === 'error') && (
            <>
              <Card className="p-6">
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    isDragActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-blue-500"
                  )}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div>
                    <p className="text-lg font-medium mb-2">
                      {isDragActive ? "Drop your file here" : "Upload Leads File"}
                    </p>
                    <p className="text-gray-500 mb-4">
                      Drag & drop or click to select your .xlsx, .xls, or .csv file
                    </p>
                    <Button variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      Choose File
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Preview table after upload */}
              {processedData && processedData.leads.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Uploaded: {fileName}</h3>
                      <p className="text-sm text-gray-500">
                        {processedData.validRows} valid leads out of {processedData.totalRows} rows
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        {processedData.validRows} valid
                      </span>
                      {processedData.errors.length > 0 && (
                        <span className="text-sm text-red-600 font-medium flex items-center gap-1">
                          <XCircle className="h-4 w-4" />
                          {processedData.errors.length} errors
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Preview table - first 5 rows */}
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {processedData.leads.slice(0, 5).map((lead, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{lead.name || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{lead.email || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{lead.company || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{lead.industry || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {processedData.leads.length > 5 && (
                      <div className="bg-gray-50 px-4 py-2 text-sm text-gray-500 text-center">
                        ... and {processedData.leads.length - 5} more leads
                      </div>
                    )}
                  </div>

                  {/* Errors display */}
                  {processedData.errors.length > 0 && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-800 mb-1">Parsing Errors:</p>
                      <ul className="text-sm text-red-700 space-y-0.5">
                        {processedData.errors.slice(0, 5).map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                        {processedData.errors.length > 5 && (
                          <li>... and {processedData.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </Card>
              )}

              {/* Error state */}
              {uploadStatus === 'error' && (
                <Card className="p-6">
                  <div className="flex items-center text-red-600">
                    <XCircle className="mr-2 h-5 w-5" />
                    <p>Error processing file. Please check your file and try again.</p>
                  </div>
                </Card>
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={() => processCompleteFlow()}
                  disabled={!processedData || processedData.leads.length === 0}
                >
                  Process with AI
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {/* ===== STEP 3: Preview & Send ===== */}
      {step === 3 && (
        <>
          {/* Processing indicator (shown during sending) */}
          {(uploadStatus === 'sending-emails') && (
            <Card className="p-6">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-green-500 animate-pulse mb-4" />
                <p className="text-lg font-medium">Sending emails...</p>
                <p className="text-gray-500">{currentStep}</p>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 bg-blue-500 rounded-full w-full transition-all duration-500"></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Sending emails to leads</p>
                </div>
              </div>
            </Card>
          )}

          {/* Success state */}
          {uploadStatus === 'success' && processedData && (
            <Card className="p-6">
              <div className="flex items-center text-green-600 mb-6">
                <CheckCircle className="mr-2 h-5 w-5" />
                <h2 className="text-xl font-semibold">Campaign Created Successfully!</h2>
              </div>

              {/* Summary Stats */}
              {processingResult?.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-medium text-blue-800">Total Leads</p>
                    <p className="text-2xl font-bold text-blue-600">{processingResult.summary.totalLeads}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="font-medium text-green-800">AI Processed</p>
                    <p className="text-2xl font-bold text-green-600">{processingResult.summary.aiProcessed}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="font-medium text-purple-800">Emails Sent</p>
                    <p className="text-2xl font-bold text-purple-600">{processingResult.summary.emailsSent}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="font-medium text-red-800">Errors</p>
                    <p className="text-2xl font-bold text-red-600">{processingResult.summary.totalErrors}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-4">
                <Button onClick={handleViewCampaign} className="flex-1">
                  View Campaign Details
                </Button>
                <Button variant="outline" onClick={() => {
                  setUploadStatus('idle')
                  setProcessedData(null)
                  setProcessingResult(null)
                  setCampaignName('')
                  setCampaignDescription('')
                  setPreviewEmails([])
                  setPendingCampaignId(null)
                  setStep(1)
                }}>
                  Create Another Campaign
                </Button>
              </div>
            </Card>
          )}

          {/* Preview emails inline (shown when idle on step 3, not yet sent) */}
          {uploadStatus === 'idle' && (
            <>
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-1">Preview AI-Generated Emails</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Review sample emails before sending to all leads. Showing {previewEmails.length} of {processedData?.validRows || 0} leads.
                </p>

                <div className="space-y-4">
                  {previewEmails.map((email: any, index: number) => (
                    <Card key={index} className="p-4 border-l-4 border-l-blue-500">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-gray-500">To: {email.originalLead?.name || 'Lead'} ({email.originalLead?.email || ''})</p>
                            <p className="text-sm text-gray-500">Company: {email.originalLead?.company || 'N/A'}</p>
                          </div>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {Math.round((email.confidence || 0) * 100)}% confidence
                          </span>
                        </div>
                        {email.channels?.email && (
                          <>
                            <div className="border-t pt-2">
                              <p className="font-medium text-sm">Subject: {email.channels.email.subject || 'N/A'}</p>
                            </div>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                              {email.channels.email.body || 'No content generated'}
                            </div>
                          </>
                        )}
                      </div>
                    </Card>
                  ))}

                  {previewEmails.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No preview available. Emails will be generated using AI personalization.
                    </div>
                  )}
                </div>
              </Card>

              {/* Summary Stats if available */}
              {processingResult?.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4 bg-blue-50">
                    <p className="font-medium text-blue-800 text-sm">Total Leads</p>
                    <p className="text-2xl font-bold text-blue-600">{processingResult.summary.totalLeads}</p>
                  </Card>
                  <Card className="p-4 bg-green-50">
                    <p className="font-medium text-green-800 text-sm">AI Processed</p>
                    <p className="text-2xl font-bold text-green-600">{processingResult.summary.aiProcessed}</p>
                  </Card>
                  <Card className="p-4 bg-purple-50">
                    <p className="font-medium text-purple-800 text-sm">Ready to Send</p>
                    <p className="text-2xl font-bold text-purple-600">{processedData?.validRows || 0}</p>
                  </Card>
                  <Card className="p-4 bg-gray-50">
                    <p className="font-medium text-gray-800 text-sm">Errors</p>
                    <p className="text-2xl font-bold text-gray-600">{processingResult.summary.totalErrors}</p>
                  </Card>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleSkipSend}>
                    Save as Draft
                  </Button>
                  <Button onClick={handleConfirmSend}>
                    Send All Emails
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Error state on step 3 */}
          {uploadStatus === 'error' && (
            <Card className="p-6">
              <div className="flex items-center text-red-600 mb-4">
                <XCircle className="mr-2 h-5 w-5" />
                <p>Error sending emails. Please try again.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={handleConfirmSend}>
                  Retry Send
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

export default EnhancedExcelUploadPage