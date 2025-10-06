"use client"

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Trash2, Eye, Heart, Folder } from 'lucide-react'
import type { EmailTemplate } from '@/lib/types/template'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface CartItemProps {
  item: {
    id: string
    template_id: string
    folder_name?: string
    is_favorite: boolean
    notes?: string
    template: EmailTemplate
  }
  onRemove: (id: string) => void
  onUpdate: (id: string, updates: any) => void
  onPreview: (template: EmailTemplate) => void
  onUseTemplate: (template: EmailTemplate) => void
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

export function CartItem({ item, onRemove, onUpdate, onPreview, onUseTemplate }: CartItemProps) {
  const [folderName, setFolderName] = useState(item.folder_name || '')
  const [isEditingFolder, setIsEditingFolder] = useState(false)

  const handleFolderSave = () => {
    onUpdate(item.id, { folder_name: folderName })
    setIsEditingFolder(false)
  }

  const handleToggleFavorite = () => {
    onUpdate(item.id, { is_favorite: !item.is_favorite })
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Template Info */}
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{item.template.name}</h3>
                <button
                  onClick={handleToggleFavorite}
                  className={cn(
                    "transition-colors",
                    item.is_favorite ? "text-red-500" : "text-gray-300 hover:text-red-400"
                  )}
                >
                  <Heart className={cn("h-4 w-4", item.is_favorite && "fill-current")} />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {item.template.description || item.template.preview_text}
              </p>
            </div>
          </div>

          {/* Mood Tags */}
          <div className="flex flex-wrap gap-1">
            {item.template.mood_tags.slice(0, 4).map((mood) => (
              <Badge
                key={mood}
                variant="secondary"
                className={cn("text-xs", getMoodBadgeColor(mood))}
              >
                {mood}
              </Badge>
            ))}
            {item.template.mood_tags.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{item.template.mood_tags.length - 4}
              </Badge>
            )}
          </div>

          {/* Folder */}
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-gray-400" />
            {isEditingFolder ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Folder name"
                  className="text-sm h-8"
                />
                <Button size="sm" onClick={handleFolderSave} className="h-8">
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFolderName(item.folder_name || '')
                    setIsEditingFolder(false)
                  }}
                  className="h-8"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingFolder(true)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {item.folder_name || 'Add to folder'}
              </button>
            )}
          </div>

          {/* Preview Text */}
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs text-gray-600 line-clamp-2 font-mono">
              {item.template.preview_text || item.template.content.substring(0, 150) + '...'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            onClick={() => onUseTemplate(item.template)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Use
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPreview(item.template)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRemove(item.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
