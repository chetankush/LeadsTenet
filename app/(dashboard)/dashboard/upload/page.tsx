"use client"

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
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
  const { user } = useUser()
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'ai-processing' | 'sending-emails' | 'success' | 'error'>('idle')
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null)
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [currentStep, setCurrentStep] = useState<string>('')
  
  // Campaign details
  const [campaignName, setCampaignName] = useState<string>('')
  const [campaignDescription, setCampaignDescription] = useState<string>('')

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Process Excel file and extract data
  const processExcelFile = useCallback(async (file: File) => {
    if (!campaignName.trim()) {
      toast.error('Please enter a campaign name before uploading')
      return
    }

    setUploadStatus('processing')
    setFileName(file.name)

    try {
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

      // Get headers from first row and normalize them
      const headers = jsonData[0] as string[]
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

      console.log('Header mapping:', {
        nameIndex,
        emailIndex,
        companyIndex,
        industryIndex,
        headers: normalizedHeaders
      })

      const leads: LeadData[] = []
      const errors: string[] = []

      // Process data rows (skip header)
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[]
        
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

        // Validation
        if (!lead.name || !lead.email) {
          errors.push(`Row ${i + 1}: Missing required fields (Name or Email)`)
          continue
        }

        if (!isValidEmail(lead.email)) {
          errors.push(`Row ${i + 1}: Invalid email format - ${lead.email}`)
          continue
        }

        leads.push(lead)
      }

      const processed: ProcessedData = {
        leads,
        errors,
        totalRows: jsonData.length - 1, // Exclude header
        validRows: leads.length
      }

      console.log('=== EXCEL DATA PROCESSING RESULTS ===')
      console.log('File:', file.name)
      console.log('Total Rows:', processed.totalRows)
      console.log('Valid Rows:', processed.validRows)
      console.log('Errors:', processed.errors.length)

      setProcessedData(processed)

      // Pass data to complete processing pipeline
      await processCompleteFlow(leads)

    } catch (error) {
      console.error('Error processing Excel file:', error)
      toast.error('Error processing Excel file')
      setUploadStatus('error')
    }
  }, [campaignName])

  // Complete processing flow with database campaign creation
  const processCompleteFlow = async (leads: LeadData[]) => {
    console.log('🚀 === STARTING PROCESSING FLOW ===')
    
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
          leads: leads,
          from_email: 'onboarding@resend.dev',
          from_name: campaignName || 'LeadsTeNet'
        })
      })

      if (!campaignResponse.ok) {
        const errorData = await campaignResponse.json()
        throw new Error(errorData.error || 'Failed to create campaign')
      }

      const campaignData = await campaignResponse.json()
      console.log('Campaign created:', campaignData)

      // Step 2: Process with AI and send emails
      setCurrentStep('Processing with AI and sending emails...')
      setUploadStatus('ai-processing')
      
      const processingResponse = await fetch('/api/process-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaignData.campaign.id,
          sendEmails: true
        })
      })

      if (!processingResponse.ok) {
        const errorData = await processingResponse.json()
        throw new Error(errorData.error || 'Failed to process campaign')
      }

      const result = await processingResponse.json()
      
      setProcessingResult({
        success: true,
        campaignId: campaignData.campaign.id,
        ...result
      })
      
      setCurrentStep('Complete!')
      setUploadStatus('success')
      
      toast.success('Campaign created and processed successfully!')
      
    } catch (error) {
      console.error('Processing error:', error)
      toast.error(error instanceof Error ? error.message : 'Processing failed')
      setCurrentStep(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setUploadStatus('error')
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      processExcelFile(file)
    }
  }, [processExcelFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Leads</h1>
        <p className="text-gray-600 mt-2">Create a new campaign by uploading your Excel file with lead data</p>
      </div>

      {/* Campaign Details */}
      {uploadStatus === 'idle' && (
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
      )}
        
      {/* Upload Area */}
      <Card className="p-6">
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive 
              ? "border-blue-500 bg-blue-50" 
              : "border-gray-300 hover:border-blue-500",
            (uploadStatus === 'processing' || uploadStatus === 'ai-processing' || uploadStatus === 'sending-emails') && "pointer-events-none opacity-50"
          )}
        >
          <input {...getInputProps()} />
          
          {uploadStatus === 'idle' ? (
            <>
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div>
                <p className="text-lg font-medium mb-2">
                  {isDragActive ? "Drop your Excel file here" : "Upload Excel File"}
                </p>
                <p className="text-gray-500 mb-4">
                  Drag & drop or click to select your .xlsx or .xls file
                </p>
                <Button variant="outline" disabled={!campaignName.trim()}>
                  <FileText className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
                {!campaignName.trim() && (
                  <p className="text-sm text-red-500 mt-2">
                    Please enter a campaign name first
                  </p>
                )}
              </div>
            </>
          ) : (
            <div>
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
                  {uploadStatus === 'processing' && 'Step 1/3: Creating campaign and processing Excel'}
                  {uploadStatus === 'ai-processing' && 'Step 2/3: Generating personalized content with AI'}
                  {uploadStatus === 'sending-emails' && 'Step 3/3: Sending emails to leads'}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Results Display */}
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
            }}>
              Create Another Campaign
            </Button>
          </div>
        </Card>
      )}

      {uploadStatus === 'error' && (
        <Card className="p-6">
          <div className="flex items-center text-red-600">
            <XCircle className="mr-2 h-5 w-5" />
            <p>Error processing campaign. Please check your file and try again.</p>
          </div>
        </Card>
      )}
    </div>
  )
}

export default EnhancedExcelUploadPage