"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, ShoppingCart, Sparkles, Users } from 'lucide-react'
import type { EmailTemplate } from '@/lib/types/template'
import { cn } from '@/lib/utils'

interface TemplateCardProps {
  template: EmailTemplate
  onPreview: (template: EmailTemplate) => void
  onAddToCart: (template: EmailTemplate) => void
  onUseTemplate: (template: EmailTemplate) => void
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

export function TemplateCard({
  template,
  onPreview,
  onAddToCart,
  onUseTemplate,
  isInCart = false
}: TemplateCardProps) {
  return (
    <Card className={cn(
      "group hover:shadow-lg transition-all duration-200 border-2",
      template.is_system ? "border-blue-200 bg-blue-50/30" : "border-purple-200 bg-purple-50/30"
    )}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                {template.name}
              </CardTitle>
              {template.is_system && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Pre-built
                </Badge>
              )}
            </div>
            <CardDescription className="text-sm line-clamp-2">
              {template.description || template.preview_text}
            </CardDescription>
          </div>
        </div>

        {/* Mood Tags */}
        <div className="flex flex-wrap gap-1 mt-3">
          {template.mood_tags.slice(0, 3).map((mood) => (
            <Badge
              key={mood}
              variant="secondary"
              className={cn("text-xs", getMoodBadgeColor(mood))}
            >
              {mood}
            </Badge>
          ))}
          {template.mood_tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{template.mood_tags.length - 3}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Preview Text */}
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 line-clamp-3 font-mono leading-relaxed">
            {template.preview_text || template.content.substring(0, 150) + '...'}
          </p>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{template.usage_count} uses</span>
          </div>
          <div className="flex items-center gap-1">
            <span>•</span>
            <span>{template.scenario}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onUseTemplate(template)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="sm"
          >
            Use Template
          </Button>
          <Button
            onClick={() => onPreview(template)}
            variant="outline"
            size="sm"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => onAddToCart(template)}
            variant="outline"
            size="sm"
            disabled={isInCart}
            className={isInCart ? "bg-green-50" : ""}
          >
            <ShoppingCart className={cn(
              "h-4 w-4",
              isInCart && "text-green-600"
            )} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
