"use client"

import { useState, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MOOD_CONFIGS, type MoodTag, extractVariables, validateTemplate } from '@/lib/types/template'
import { cn } from '@/lib/utils'
import { Save, Eye, Plus, X, Sparkles } from 'lucide-react'
import 'react-quill/dist/quill.snow.css'

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

interface TemplateEditorProps {
  initialTemplate?: {
    id?: string
    name: string
    description: string
    subject_template: string
    content: string
    mood_tags: MoodTag[]
    scenario: string
    variables: Record<string, string>
  }
  onSave: (template: any) => void
  onCancel: () => void
}

const SCENARIOS = [
  'introduction',
  'follow_up',
  'sales_pitch',
  'event_invitation',
  'apology',
  'urgent_notification',
  'thank_you',
  'newsletter',
  'support_response',
  'meeting_request',
  'product_launch',
  'feedback_request',
  'reminder',
  'welcome',
  're_engagement'
]

export function TemplateEditor({ initialTemplate, onSave, onCancel }: TemplateEditorProps) {
  const [name, setName] = useState(initialTemplate?.name || '')
  const [description, setDescription] = useState(initialTemplate?.description || '')
  const [subjectTemplate, setSubjectTemplate] = useState(initialTemplate?.subject_template || '')
  const [content, setContent] = useState(initialTemplate?.content || '')
  const [scenario, setScenario] = useState(initialTemplate?.scenario || 'introduction')
  const [selectedMoods, setSelectedMoods] = useState<MoodTag[]>(initialTemplate?.mood_tags || [])
  const [customVariables, setCustomVariables] = useState<Record<string, string>>(
    initialTemplate?.variables || {}
  )
  const [newVarKey, setNewVarKey] = useState('')
  const [newVarDesc, setNewVarDesc] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // Extract variables from content
  const detectedVariables = useMemo(() => {
    return extractVariables(content)
  }, [content])

  // Quill modules configuration
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ],
  }), [])

  const toggleMood = (mood: MoodTag) => {
    setSelectedMoods(prev =>
      prev.includes(mood)
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    )
  }

  const addCustomVariable = () => {
    if (newVarKey && newVarDesc) {
      setCustomVariables(prev => ({
        ...prev,
        [newVarKey]: newVarDesc
      }))
      setNewVarKey('')
      setNewVarDesc('')
    }
  }

  const removeCustomVariable = (key: string) => {
    setCustomVariables(prev => {
      const updated = { ...prev }
      delete updated[key]
      return updated
    })
  }

  const handleSave = () => {
    // Validate
    const validation = validateTemplate(content, subjectTemplate)
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    if (!name.trim()) {
      setErrors(['Template name is required'])
      return
    }

    if (selectedMoods.length === 0) {
      setErrors(['Select at least one mood tag'])
      return
    }

    // Merge detected and custom variables
    const allVariables = { ...customVariables }
    detectedVariables.forEach(varName => {
      if (!allVariables[varName]) {
        allVariables[varName] = `Custom variable: ${varName}`
      }
    })

    const template = {
      id: initialTemplate?.id,
      name: name.trim(),
      description: description.trim(),
      subject_template: subjectTemplate.trim(),
      content: content.trim(),
      mood_tags: selectedMoods,
      scenario,
      variables: allVariables
    }

    onSave(template)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {initialTemplate?.id ? 'Edit Template' : 'Create New Template'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Design your email template with rich text formatting
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Edit' : 'Preview'}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {errors.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="space-y-1">
            {errors.map((error, i) => (
              <p key={i} className="text-sm text-red-700">• {error}</p>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          {!showPreview ? (
            <>
              {/* Basic Info */}
              <Card className="p-6 space-y-4">
                <div>
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Professional Introduction Email"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe when to use this template..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="scenario">Scenario</Label>
                  <select
                    id="scenario"
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SCENARIOS.map(s => (
                      <option key={s} value={s}>
                        {s.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </Card>

              {/* Subject Line */}
              <Card className="p-6">
                <Label htmlFor="subject">Subject Line Template</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Quick question for {{company}}"
                  value={subjectTemplate}
                  onChange={(e) => setSubjectTemplate(e.target.value)}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Use {'{{variableName}}'} for dynamic content
                </p>
              </Card>

              {/* Email Content Editor */}
              <Card className="p-6">
                <Label>Email Content *</Label>
                <div className="mt-2 bg-white border border-gray-300 rounded-md overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={modules}
                    placeholder="Write your email template here... Use {{variableName}} for personalization"
                    className="min-h-[300px]"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Detected variables: {detectedVariables.length > 0 ? detectedVariables.map(v => `{{${v}}}`).join(', ') : 'None'}
                </p>
              </Card>
            </>
          ) : (
            /* Preview Mode */
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Subject Line</h3>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium">{subjectTemplate || 'No subject set'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Email Body</h3>
                  <div
                    className="p-4 bg-white border border-gray-200 rounded-md prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-400">No content yet</p>' }}
                  />
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Mood Tags */}
          <Card className="p-6">
            <Label className="mb-3 block">Mood Tags *</Label>
            <div className="flex flex-wrap gap-2">
              {MOOD_CONFIGS.filter(m => m.value !== 'all').map((mood) => {
                const isSelected = selectedMoods.includes(mood.value as MoodTag)
                return (
                  <button
                    key={mood.value}
                    onClick={() => toggleMood(mood.value as MoodTag)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      isSelected
                        ? `bg-${mood.color}-600 text-white ring-2 ring-${mood.color}-300`
                        : `bg-${mood.color}-100 text-${mood.color}-700 hover:bg-${mood.color}-200`
                    )}
                    title={mood.description}
                  >
                    {mood.label}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Selected: {selectedMoods.length}
            </p>
          </Card>

          {/* Custom Variables */}
          <Card className="p-6">
            <Label className="mb-3 block">Custom Variables</Label>

            {/* Existing Variables */}
            <div className="space-y-2 mb-4">
              {Object.entries(customVariables).map(([key, desc]) => (
                <div key={key} className="flex items-start gap-2 p-2 bg-blue-50 rounded-md">
                  <div className="flex-1 min-w-0">
                    <code className="text-xs font-mono text-blue-700">{'{{' + key + '}}'}</code>
                    <p className="text-xs text-gray-600 mt-1 truncate">{desc}</p>
                  </div>
                  <button
                    onClick={() => removeCustomVariable(key)}
                    className="text-red-600 hover:text-red-700 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Variable */}
            <div className="space-y-2 pt-4 border-t">
              <Input
                placeholder="Variable name"
                value={newVarKey}
                onChange={(e) => setNewVarKey(e.target.value)}
                className="text-sm"
              />
              <Input
                placeholder="Description"
                value={newVarDesc}
                onChange={(e) => setNewVarDesc(e.target.value)}
                className="text-sm"
              />
              <Button
                onClick={addCustomVariable}
                size="sm"
                variant="outline"
                className="w-full"
                disabled={!newVarKey || !newVarDesc}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Variable
              </Button>
            </div>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              onClick={handleSave}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
