"use client"

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Upload, FileText, CheckCircle, XCircle } from 'lucide-react'

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

interface EmailConfig {
  fromEmail: string
  fromName: string
  replyTo?: string
}

interface ProcessingResult {
  success: boolean
  aiResponse?: any
  emailResults?: any
  summary?: {
    totalLeads: number
    aiProcessed: number
    emailsSent: number
    totalErrors: number
  }
}

const ExcelUploadPage = () => {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'ai-processing' | 'sending-emails' | 'success' | 'error'>('idle')
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null)
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [currentStep, setCurrentStep] = useState<string>('')
  const [emailConfig] = useState<EmailConfig>({
    fromEmail: 'onboarding@resend.dev', // Using verified Resend sender
    fromName: 'Lead Generation AI',
    replyTo: 'onboarding@resend.dev'
  })

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Process Excel file and extract data
  const processExcelFile = useCallback(async (file: File) => {
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

      // Console log the fetched data
      console.log('=== EXCEL DATA PROCESSING RESULTS ===')
      console.log('File:', file.name)
      console.log('Total Rows:', processed.totalRows)
      console.log('Valid Rows:', processed.validRows)
      console.log('Errors:', processed.errors.length)
      console.log('Processed Leads Data:', leads)
      console.log('Sample lead:', leads[0])

      // Store data in JSON file (client-side for demo)
      const dataToStore = {
        fileName: file.name,
        processedAt: new Date().toISOString(),
        ...processed
      }

      // Create downloadable JSON file
      const dataStr = JSON.stringify(dataToStore, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `processed_leads_${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setProcessedData(processed)
      setUploadStatus('success')

      // Pass data to complete processing pipeline
      await processCompleteFlow(leads)

    } catch (error) {
      console.error('Error processing Excel file:', error)
      setUploadStatus('error')
    }
  }, [])

  // Complete processing flow: Excel -> AI -> Email
  const processCompleteFlow = async (leads: LeadData[]) => {
    console.log('🚀 === STARTING COMPLETE PROCESSING FLOW ===')
    console.log('📊 Flow Details:')
    console.log('- Number of leads to process:', leads.length)
    console.log('- Channels: [email]')
    console.log('- Will send emails: true')
    console.log('- Email config:', emailConfig)
    console.log('- Sample lead data:', leads[0])
    
    try {
      // Step 1: Update UI status
      setCurrentStep('Processing with AI...')
      setUploadStatus('ai-processing')
      
      console.log('📡 Sending request to process-leads API...')
      
      const requestBody = {
        leads: leads,
        channels: ['email'],
        emailConfig: emailConfig,
        sendEmails: true
      }
      
      console.log('📤 Request body prepared:', {
        leadsCount: requestBody.leads.length,
        channels: requestBody.channels,
        sendEmails: requestBody.sendEmails,
        fromEmail: requestBody.emailConfig.fromEmail
      })
      
      // Step 2: Call server API
      const response = await fetch('/api/process-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('📡 API Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API Error Response:', errorData)
        throw new Error(`API Error: ${errorData.error || 'Unknown error'}`)
      }
      
      // Step 3: Process response
      setCurrentStep('Sending emails...')
      setUploadStatus('sending-emails')
      
      const result: ProcessingResult = await response.json()
      
      console.log('✅ Complete processing result:', result)
      console.log('📊 Final Summary:')
      console.log('- Success:', result.success)
      console.log('- Total leads processed:', result.summary?.totalLeads)
      console.log('- AI processed:', result.summary?.aiProcessed)
      console.log('- Emails sent:', result.summary?.emailsSent)
      console.log('- Total errors:', result.summary?.totalErrors)
      
      if (result.aiResponse?.processedLeads?.length > 0) {
        console.log('🤖 AI Generated Content Samples:')
        result.aiResponse.processedLeads.slice(0, 3).forEach((processed: any, index: number) => {
          const emailContent = processed.channels.email
          if (emailContent) {
            console.log(`📧 Email ${index + 1} for ${processed.originalLead.name}:`)
            console.log('  Subject:', emailContent.subject)
            console.log('  Body preview:', emailContent.body.substring(0, 100) + '...')
            console.log('  Confidence:', processed.confidence + '%')
            console.log('  ---')
          }
        })
      }
      
      if (result.emailResults?.results?.length > 0) {
        console.log('📨 Email Sending Results:')
        result.emailResults.results.forEach((emailResult: any, index: number) => {
          const status = emailResult.success ? '✅' : '❌'
          console.log(`${status} Email ${index + 1}: ${emailResult.leadName} (${emailResult.leadEmail})`)
          if (emailResult.messageId) {
            console.log(`  Message ID: ${emailResult.messageId}`)
          }
          if (emailResult.error) {
            console.log(`  Error: ${emailResult.error}`)
          }
        })
      }
      
      // Step 4: Update UI with results
      setProcessingResult(result)
      setCurrentStep('Complete!')
      setUploadStatus('success')
      
      console.log('🎉 PROCESSING FLOW COMPLETED SUCCESSFULLY!')
      
    } catch (error) {
      console.error('💥 COMPLETE FLOW ERROR:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
      
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Excel Lead Upload</h1>
        
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary",
            (uploadStatus === 'processing' || uploadStatus === 'ai-processing' || uploadStatus === 'sending-emails') && "pointer-events-none opacity-50"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          
          {(uploadStatus === 'processing' || uploadStatus === 'ai-processing' || uploadStatus === 'sending-emails') ? (
            <div>
              <p className="text-lg font-medium">
                {uploadStatus === 'processing' && `Processing ${fileName}...`}
                {uploadStatus === 'ai-processing' && `Generating AI content...`}
                {uploadStatus === 'sending-emails' && `Sending emails...`}
              </p>
              <p className="text-muted-foreground">{currentStep}</p>
              <div className="mt-4 space-y-2">
                <div className={`h-2 bg-muted rounded ${uploadStatus !== 'processing' ? 'bg-success/20' : ''}`}>
                  <div className={`h-full bg-success rounded transition-all duration-500 ${
                    uploadStatus === 'processing' ? 'w-1/3' :
                    uploadStatus === 'ai-processing' ? 'w-2/3' :
                    uploadStatus === 'sending-emails' ? 'w-full' : 'w-0'
                  }`}></div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {uploadStatus === 'processing' && 'Step 1/3: Parsing Excel file'}
                  {uploadStatus === 'ai-processing' && 'Step 2/3: Generating personalized content with AI'}
                  {uploadStatus === 'sending-emails' && 'Step 3/3: Sending emails to all leads'}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium mb-2">
                {isDragActive ? "Drop your Excel file here" : "Upload Excel File"}
              </p>
              <p className="text-muted-foreground mb-4">
                Drag & drop or click to select your .xlsx or .xls file
              </p>
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Choose File
              </Button>
            </div>
          )}
        </div>

        {/* Results Display */}
        {uploadStatus === 'success' && processedData && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center text-success">
              <CheckCircle className="mr-2 h-5 w-5" />
              <h2 className="text-xl font-semibold">Processing Complete!</h2>
            </div>
            
            {/* Summary Stats */}
            {processingResult?.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="font-medium text-primary">Total Leads</p>
                  <p className="text-2xl font-bold text-primary">{processingResult.summary.totalLeads}</p>
                </div>
                <div className="bg-success/10 p-4 rounded-lg">
                  <p className="font-medium text-success">AI Processed</p>
                  <p className="text-2xl font-bold text-success">{processingResult.summary.aiProcessed}</p>
                </div>
                <div className="bg-success/10 p-4 rounded-lg">
                  <p className="font-medium text-success">Emails Sent</p>
                  <p className="text-2xl font-bold text-success">{processingResult.summary.emailsSent}</p>
                </div>
                <div className="bg-destructive/10 p-4 rounded-lg">
                  <p className="font-medium text-destructive">Errors</p>
                  <p className="text-2xl font-bold text-destructive">{processingResult.summary.totalErrors}</p>
                </div>
              </div>
            )}

            {/* Excel Processing Errors */}
            {processedData.errors.length > 0 && (
              <div className="bg-destructive/10 p-4 rounded-lg">
                <h3 className="font-medium text-destructive mb-2">Excel Processing Errors ({processedData.errors.length})</h3>
                <ul className="text-sm text-destructive space-y-1">
                  {processedData.errors.slice(0, 5).map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                  {processedData.errors.length > 5 && (
                    <li>... and {processedData.errors.length - 5} more errors</li>
                  )}
                </ul>
              </div>
            )}

            {/* AI Processing Results */}
            {processingResult?.aiResponse?.processedLeads && (
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-3">🤖 AI Generated Content Sample:</h3>
                <div className="space-y-3">
                  {processingResult.aiResponse.processedLeads.slice(0, 2).map((processed: any, index: number) => (
                    <div key={index} className="bg-card p-3 rounded border">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-foreground">{processed.originalLead.name}</h4>
                        <span className="text-sm bg-success/10 text-success px-2 py-1 rounded">
                          {processed.confidence}% confidence
                        </span>
                      </div>
                      {processed.channels.email && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Subject:</p>
                          <p className="text-sm text-muted-foreground mb-2">{processed.channels.email.subject}</p>
                          <p className="text-sm font-medium text-muted-foreground">Body Preview:</p>
                          <p className="text-sm text-muted-foreground italic">
                            {processed.channels.email.body.substring(0, 120)}...
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Email Sending Results */}
            {processingResult?.emailResults?.results && (
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-3">📧 Email Sending Results:</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {processingResult.emailResults.results.map((result: any, index: number) => (
                    <div key={index} className={`flex items-center justify-between p-2 rounded text-sm ${
                      result.success ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                    }`}>
                      <span className="flex items-center">
                        <span className="mr-2">{result.success ? '✅' : '❌'}</span>
                        {result.leadName} ({result.leadEmail})
                      </span>
                      {result.success && result.messageId && (
                        <span className="text-xs text-muted-foreground">ID: {result.messageId.substring(0, 8)}...</span>
                      )}
                      {!result.success && result.error && (
                        <span className="text-xs">{result.error}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Debug Info */}
            <div className="bg-muted p-4 rounded-lg">
              <details>
                <summary className="cursor-pointer font-medium text-muted-foreground mb-2">🔧 Debug Information (Click to expand)</summary>
                <div className="space-y-2">
                  <div>
                    <h4 className="font-medium text-sm">Excel Data Sample:</h4>
                    <pre className="text-xs overflow-auto bg-card p-2 rounded border">
                      {JSON.stringify(processedData.leads.slice(0, 2), null, 2)}
                    </pre>
                  </div>
                  {processingResult && (
                    <div>
                      <h4 className="font-medium text-sm">Complete Processing Result:</h4>
                      <pre className="text-xs overflow-auto bg-card p-2 rounded border max-h-40">
                        {JSON.stringify(processingResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            </div>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="mt-8 flex items-center text-destructive">
            <XCircle className="mr-2 h-5 w-5" />
            <p>Error processing file. Please check the console for details.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExcelUploadPage