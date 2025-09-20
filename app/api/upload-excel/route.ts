import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

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

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: ''
    })

    if (jsonData.length === 0) {
      return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 })
    }

    // Process headers and data
    const headers = jsonData[0] as string[]
    const normalizedHeaders = headers.map(h => h?.toString().toLowerCase().trim())

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
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[]
      
      if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
        continue
      }

      const lead: LeadData = {}
      
      if (nameIndex >= 0 && row[nameIndex]) {
        lead.name = row[nameIndex].toString().trim()
      }
      
      if (emailIndex >= 0 && row[emailIndex]) {
        lead.email = row[emailIndex].toString().trim()
      }
      
      if (companyIndex >= 0 && row[companyIndex]) {
        lead.company = row[companyIndex].toString().trim()
      }
      
      if (industryIndex >= 0 && row[industryIndex]) {
        lead.industry = row[industryIndex].toString().trim()
      }

      // Add other columns
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

    const processedData: ProcessedData = {
      leads,
      errors,
      totalRows: jsonData.length - 1,
      validRows: leads.length
    }

    // Save to JSON file in uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const fileName = `processed_leads_${Date.now()}.json`
    const filePath = path.join(uploadsDir, fileName)
    
    const dataToSave = {
      fileName: file.name,
      processedAt: new Date().toISOString(),
      ...processedData
    }

    await writeFile(filePath, JSON.stringify(dataToSave, null, 2))

    // Console log results
    console.log('=== SERVER-SIDE EXCEL PROCESSING ===')
    console.log('File:', file.name)
    console.log('Saved to:', filePath)
    console.log('Total Rows:', processedData.totalRows)
    console.log('Valid Rows:', processedData.validRows)
    console.log('Sample Lead:', leads[0])

    return NextResponse.json({
      success: true,
      data: processedData,
      savedFile: fileName
    })

  } catch (error) {
    console.error('Server error processing Excel:', error)
    return NextResponse.json(
      { error: 'Failed to process Excel file' }, 
      { status: 500 }
    )
  }
}