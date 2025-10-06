"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Copy, Eye, ShoppingCart, Sparkles } from 'lucide-react'
import type { EmailTemplate } from '@/lib/types/template'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TemplatePreviewModalProps {
  template: EmailTemplate | null
  open: boolean
  onClose: () => void
  onUseTemplate: (template: EmailTemplate) => void
  onAddToCart: (template: EmailTemplate) => void
  isInCart?: boolean
}

const getMoodBadgeColor = (mood: string) => {
  const colors: Record<string, string> = {
    professional: 'bg-blue-100 text-blue-800',
    friendly: 'bg-green-100 text-green-800',
    warm: 'bg-orange-100 text-orange-800',
    formal: 'bg-indigo-100 text-indigo-800',
    casual: 'bg-teal-100 text-teal-800',
    persuasive: 'bg-purple-100 text-purple-800',
    empathetic: 'bg-pink-100 text-pink-800',
    urgent: 'bg-red-100 text-red-800',
    celebratory: 'bg-yellow-100 text-yellow-800',
    apologetic: 'bg-rose-100 text-rose-800',
    helpful: 'bg-cyan-100 text-cyan-800'
  }
  return colors[mood] || 'bg-gray-100 text-gray-800'
}

export function TemplatePreviewModal({
  template,
  open,
  onClose,
  onUseTemplate,
  onAddToCart,
  isInCart = false
}: TemplatePreviewModalProps) {
  if (!template) return null

  const copyToClipboard = () => {
    navigator.clipboard.writeText(template.content)
    toast.success('Template content copied to clipboard')
  }

  const variables = Object.entries(template.variables || {})

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-2xl">{template.name}</DialogTitle>
            {template.is_system && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Sparkles className="h-3 w-3 mr-1" />
                Pre-built
              </Badge>
            )}
          </div>
          <DialogDescription>
            {template.description || `${template.scenario} template`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mood Tags */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Mood & Tone</h3>
            <div className="flex flex-wrap gap-2">
              {template.mood_tags.map((mood) => (
                <Badge
                  key={mood}
                  variant="secondary"
                  className={cn("text-xs", getMoodBadgeColor(mood))}
                >
                  {mood}
                </Badge>
              ))}
            </div>
          </div>

          {/* Subject Template */}
          {template.subject_template && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Subject Line</h3>
              <Card className="p-3 bg-gray-50">
                <p className="text-sm font-medium text-gray-900">{template.subject_template}</p>
              </Card>
            </div>
          )}

          {/* Email Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Email Content</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <Card className="p-4 bg-white border-2 border-gray-200">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-900 leading-relaxed">
                {template.content}
              </pre>
            </Card>
          </div>

          {/* Variables */}
          {variables.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Available Variables</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {variables.map(([key, description]) => (
                  <Card key={key} className="p-3 bg-blue-50 border-blue-200">
                    <div className="flex items-start gap-2">
                      <code className="text-xs font-mono bg-blue-100 px-2 py-1 rounded text-blue-800 flex-shrink-0">
                        {'{{' + key + '}}'}
                      </code>
                      <p className="text-xs text-gray-600">{description}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Usage Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-500 pt-4 border-t">
            <div>
              <span className="font-medium">Scenario:</span> {template.scenario}
            </div>
            <div>•</div>
            <div>
              <span className="font-medium">Usage:</span> {template.usage_count} times
            </div>
            <div>•</div>
            <div>
              <span className="font-medium">Created:</span> {new Date(template.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onAddToCart(template)
              onClose()
            }}
            disabled={isInCart}
            className={isInCart ? "bg-green-50" : ""}
          >
            <ShoppingCart className={cn(
              "h-4 w-4 mr-2",
              isInCart && "text-green-600"
            )} />
            {isInCart ? 'In Cart' : 'Add to Cart'}
          </Button>
          <Button
            onClick={() => {
              onUseTemplate(template)
              onClose()
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Eye className="h-4 w-4 mr-2" />
            Use This Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
