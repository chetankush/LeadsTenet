"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Search, Plus, ShoppingCart, Sparkles } from 'lucide-react'
import { MoodFilter } from '@/components/templates/mood-filter'
import { TemplateCard } from '@/components/templates/template-card'
import { TemplatePreviewModal } from '@/components/templates/template-preview-modal'
import type { EmailTemplate, MoodTag } from '@/lib/types/template'
import { toast } from 'sonner'

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [cartTemplateIds, setCartTemplateIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMood, setSelectedMood] = useState<MoodTag | 'all'>('all')
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchTemplates()
    fetchCart()
  }, [selectedMood, searchQuery])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (selectedMood !== 'all') {
        params.append('mood', selectedMood)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await fetch(`/api/templates?${params}`)
      const data = await response.json()

      if (data.success) {
        setTemplates(data.templates)
      } else {
        toast.error('Failed to load templates')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Error loading templates')
    } finally {
      setLoading(false)
    }
  }

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/templates/cart')
      const data = await response.json()

      if (data.success) {
        const ids = new Set<string>(data.cartItems.map((item: any) => item.template_id))
        setCartTemplateIds(ids)
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
    }
  }

  const handleAddToCart = async (template: EmailTemplate) => {
    try {
      const response = await fetch('/api/templates/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: template.id })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Template added to cart!')
        setCartTemplateIds(prev => new Set([...Array.from(prev), template.id]))
      } else if (response.status === 409) {
        toast.info('Template already in your cart')
      } else {
        toast.error(data.error || 'Failed to add to cart')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Error adding to cart')
    }
  }

  const handlePreview = (template: EmailTemplate) => {
    setPreviewTemplate(template)
    setShowPreview(true)
  }

  const handleUseTemplate = (template: EmailTemplate) => {
    // Store selected template in session storage
    sessionStorage.setItem('selectedTemplate', JSON.stringify(template))
    // Redirect to campaign creation with template
    toast.success('Template selected! Redirecting to campaign creation...')
    setTimeout(() => {
      router.push('/dashboard/campaigns/new?template=' + template.id)
    }, 500)
  }

  const filteredTemplates = templates

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600 mt-2">
            Choose from professional templates or create your own
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/templates/cart')}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            My Cart ({cartTemplateIds.size})
          </Button>
          <Button
            onClick={() => router.push('/dashboard/templates/editor')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Template
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search templates by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Mood Filter */}
      <Card className="p-6">
        <MoodFilter
          selectedMood={selectedMood}
          onMoodChange={setSelectedMood}
        />
      </Card>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-64 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card className="p-12 text-center">
          <Sparkles className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No templates found
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || selectedMood !== 'all'
              ? 'Try adjusting your filters or search query'
              : 'Create your first custom template to get started'}
          </p>
          <Button
            onClick={() => router.push('/dashboard/templates/editor')}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onPreview={handlePreview}
                onAddToCart={handleAddToCart}
                onUseTemplate={handleUseTemplate}
                isInCart={cartTemplateIds.has(template.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Preview Modal */}
      <TemplatePreviewModal
        template={previewTemplate}
        open={showPreview}
        onClose={() => setShowPreview(false)}
        onUseTemplate={handleUseTemplate}
        onAddToCart={handleAddToCart}
        isInCart={previewTemplate ? cartTemplateIds.has(previewTemplate.id) : false}
      />
    </div>
  )
}
