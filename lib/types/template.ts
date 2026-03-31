// Email Template Types

export type MoodTag =
  | 'professional'
  | 'friendly'
  | 'warm'
  | 'formal'
  | 'casual'
  | 'persuasive'
  | 'empathetic'
  | 'urgent'
  | 'celebratory'
  | 'apologetic'
  | 'helpful'

export type TemplateStatus = 'active' | 'draft' | 'archived'

export type TemplateScenario =
  | 'Professional Introduction'
  | 'Friendly Follow-up'
  | 'Sales Pitch'
  | 'Event Invitation'
  | 'Apology Message'
  | 'Urgent Notification'
  | 'Thank You Note'
  | 'Newsletter Update'
  | 'Customer Support Response'
  | 'Meeting Request'
  | 'Custom'

export interface EmailTemplate {
  id: string
  name: string
  description: string | null
  content: string
  subject_template: string | null
  is_system: boolean
  created_by: string | null
  mood_tags: MoodTag[]
  custom_tags: string[]
  scenario: TemplateScenario
  usage_count: number
  variables: Record<string, string>
  preview_text: string | null
  thumbnail_url: string | null
  status: TemplateStatus
  created_at: string
  updated_at: string
}

export interface UserTemplateCart {
  id: string
  user_id: string
  template_id: string
  folder_name: string | null
  is_favorite: boolean
  custom_notes: string | null
  added_at: string
  template?: EmailTemplate // Join data
}

export interface CampaignTemplate {
  id: string
  campaign_id: string
  template_id: string
  assigned_at: string
  assigned_by: string | null
  variant_name: string | null
  split_percentage: number
  is_active: boolean
  template?: EmailTemplate // Join data
}

export interface TemplateVariable {
  key: string
  label: string
  description?: string
  defaultValue?: string
  required?: boolean
}

export interface CreateTemplateData {
  name: string
  description?: string
  content: string
  subject_template?: string
  mood_tags: MoodTag[]
  custom_tags?: string[]
  scenario: TemplateScenario
  variables?: Record<string, string>
  preview_text?: string
  status?: TemplateStatus
}

export interface UpdateTemplateData extends Partial<CreateTemplateData> {
  id: string
}

export interface TemplateFilterOptions {
  mood?: MoodTag | 'all'
  scenario?: TemplateScenario | 'all'
  search?: string
  isSystem?: boolean
  status?: TemplateStatus
}

export interface TemplateCartItem extends UserTemplateCart {
  template: EmailTemplate
}

// Mood configuration for UI
export interface MoodConfig {
  value: MoodTag | 'all'
  label: string
  description: string
  color: string
  icon?: string
}

export const MOOD_CONFIGS: MoodConfig[] = [
  { value: 'all', label: 'All Templates', description: 'Show all available templates', color: 'gray' },
  { value: 'professional', label: 'Professional', description: 'Formal business communication', color: 'blue' },
  { value: 'friendly', label: 'Friendly', description: 'Approachable and warm', color: 'green' },
  { value: 'warm', label: 'Warm', description: 'Personal and caring', color: 'orange' },
  { value: 'formal', label: 'Formal', description: 'Traditional business tone', color: 'indigo' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and conversational', color: 'teal' },
  { value: 'persuasive', label: 'Persuasive', description: 'Compelling and convincing', color: 'purple' },
  { value: 'empathetic', label: 'Empathetic', description: 'Understanding and supportive', color: 'pink' },
  { value: 'urgent', label: 'Urgent', description: 'Time-sensitive matters', color: 'red' },
  { value: 'celebratory', label: 'Celebratory', description: 'Joyful and congratulatory', color: 'yellow' },
  { value: 'apologetic', label: 'Apologetic', description: 'Sincere apologies', color: 'rose' },
  { value: 'helpful', label: 'Helpful', description: 'Supportive assistance', color: 'cyan' }
]

// Template variable parser helper
export function extractVariables(template: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g
  const matches = []
  let match

  while ((match = regex.exec(template)) !== null) {
    matches.push(match[1].trim())
  }

  return Array.from(new Set(matches)) // Remove duplicates
}

// Replace variables in template
export function replaceVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    result = result.replace(regex, value || `{{${key}}}`)
  })

  return result
}

// Validate template content
export function validateTemplate(content: string, subject?: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!content || content.trim().length === 0) {
    errors.push('Template content cannot be empty')
  }

  if (content.length > 50000) {
    errors.push('Template content is too long (max 50,000 characters)')
  }

  if (subject && subject.length > 500) {
    errors.push('Subject line is too long (max 500 characters)')
  }

  const variables = extractVariables(content)
  if (subject) {
    variables.push(...extractVariables(subject))
  }

  // Check for potential XSS
  const dangerousPatterns = ['<script', 'javascript:', 'onerror=', 'onclick=']
  dangerousPatterns.forEach(pattern => {
    if (content.toLowerCase().includes(pattern)) {
      errors.push(`Potentially unsafe content detected: ${pattern}`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}
