"use client"

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TemplateEditor } from '@/components/templates/template-editor'
import { toast } from 'sonner'

export default function TemplateEditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('id')
  const [loading, setLoading] = useState(false)

  const handleSave = async (template: any) => {
    try {
      setLoading(true)

      const url = templateId
        ? `/api/templates/${templateId}`
        : '/api/templates'

      const method = templateId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      })

      const data = await response.json()

      if (data.success) {
        toast.success(templateId ? 'Template updated!' : 'Template created!')
        router.push('/dashboard/templates')
      } else {
        toast.error(data.error || 'Failed to save template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Error saving template')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/templates')
  }

  return (
    <div className="p-6">
      <TemplateEditor
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  )
}
