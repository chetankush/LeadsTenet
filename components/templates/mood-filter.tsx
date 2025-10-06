"use client"

import { Badge } from '@/components/ui/badge'
import { MOOD_CONFIGS, type MoodTag } from '@/lib/types/template'
import { cn } from '@/lib/utils'

interface MoodFilterProps {
  selectedMood: MoodTag | 'all'
  onMoodChange: (mood: MoodTag | 'all') => void
}

const getMoodColor = (color: string, isSelected: boolean) => {
  const colors: Record<string, { bg: string, text: string, selected: string }> = {
    gray: { bg: 'bg-gray-100', text: 'text-gray-700', selected: 'bg-gray-600 text-white' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', selected: 'bg-blue-600 text-white' },
    green: { bg: 'bg-green-100', text: 'text-green-700', selected: 'bg-green-600 text-white' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-700', selected: 'bg-orange-600 text-white' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', selected: 'bg-indigo-600 text-white' },
    teal: { bg: 'bg-teal-100', text: 'text-teal-700', selected: 'bg-teal-600 text-white' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700', selected: 'bg-purple-600 text-white' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-700', selected: 'bg-pink-600 text-white' },
    red: { bg: 'bg-red-100', text: 'text-red-700', selected: 'bg-red-600 text-white' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', selected: 'bg-yellow-600 text-white' },
    rose: { bg: 'bg-rose-100', text: 'text-rose-700', selected: 'bg-rose-600 text-white' },
    cyan: { bg: 'bg-cyan-100', text: 'text-cyan-700', selected: 'bg-cyan-600 text-white' }
  }

  return isSelected ? colors[color].selected : `${colors[color].bg} ${colors[color].text}`
}

export function MoodFilter({ selectedMood, onMoodChange }: MoodFilterProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Filter by Mood</h3>
        {selectedMood !== 'all' && (
          <button
            onClick={() => onMoodChange('all')}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear filter
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {MOOD_CONFIGS.map((mood) => {
          const isSelected = selectedMood === mood.value

          return (
            <button
              key={mood.value}
              onClick={() => onMoodChange(mood.value)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                "hover:scale-105 hover:shadow-md",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                getMoodColor(mood.color, isSelected),
                isSelected && "shadow-md ring-2 ring-offset-2 ring-opacity-50"
              )}
              title={mood.description}
            >
              {mood.label}
            </button>
          )
        })}
      </div>

      {selectedMood !== 'all' && (
        <div className="text-xs text-gray-500 italic">
          {MOOD_CONFIGS.find(m => m.value === selectedMood)?.description}
        </div>
      )}
    </div>
  )
}
