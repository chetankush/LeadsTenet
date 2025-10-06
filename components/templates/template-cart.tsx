"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CartItem } from './cart-item'
import { TemplatePreviewModal } from './template-preview-modal'
import { ShoppingCart, Search, Filter, Heart, Folder as FolderIcon } from 'lucide-react'
import type { EmailTemplate } from '@/lib/types/template'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface CartItemData {
  id: string
  template_id: string
  folder_name?: string
  is_favorite: boolean
  notes?: string
  template: EmailTemplate
}

export function TemplateCart() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItemData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterFavorites, setFilterFavorites] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/templates/cart')
      const data = await response.json()

      if (data.success) {
        setCartItems(data.cartItems)
      } else {
        toast.error('Failed to load cart')
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
      toast.error('Error loading cart')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (itemId: string) => {
    try {
      const response = await fetch(`/api/templates/cart/${itemId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Removed from cart')
        setCartItems(prev => prev.filter(item => item.id !== itemId))
      } else {
        toast.error('Failed to remove item')
      }
    } catch (error) {
      console.error('Error removing item:', error)
      toast.error('Error removing item')
    }
  }

  const handleUpdate = async (itemId: string, updates: any) => {
    try {
      const response = await fetch(`/api/templates/cart/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (data.success) {
        setCartItems(prev =>
          prev.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
          )
        )
        toast.success('Cart updated')
      } else {
        toast.error('Failed to update')
      }
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Error updating item')
    }
  }

  const handlePreview = (template: EmailTemplate) => {
    setPreviewTemplate(template)
    setShowPreview(true)
  }

  const handleUseTemplate = (template: EmailTemplate) => {
    sessionStorage.setItem('selectedTemplate', JSON.stringify(template))
    toast.success('Template selected! Redirecting to campaign creation...')
    setTimeout(() => {
      router.push('/dashboard/campaigns/new?template=' + template.id)
    }, 500)
  }

  const handleAddToCart = async (template: EmailTemplate) => {
    // Already in cart, so this is just for modal compatibility
    toast.info('Template already in your cart')
  }

  // Get unique folders
  const folders = Array.from(new Set(cartItems.filter(item => item.folder_name).map(item => item.folder_name)))

  // Filter items
  const filteredItems = cartItems.filter(item => {
    if (filterFavorites && !item.is_favorite) return false
    if (selectedFolder && item.folder_name !== selectedFolder) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        item.template.name.toLowerCase().includes(query) ||
        item.template.description?.toLowerCase().includes(query) ||
        item.template.scenario.toLowerCase().includes(query)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Template Cart</h1>
          <p className="text-gray-600 mt-2">
            Manage your saved templates and organize them into folders
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/templates')}
        >
          Browse Templates
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search cart..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Folder Filter */}
          <div>
            <select
              value={selectedFolder || ''}
              onChange={(e) => setSelectedFolder(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Folders</option>
              {folders.map((folder) => (
                <option key={folder} value={folder}>
                  {folder}
                </option>
              ))}
            </select>
          </div>

          {/* Favorites Filter */}
          <Button
            variant={filterFavorites ? 'default' : 'outline'}
            onClick={() => setFilterFavorites(!filterFavorites)}
            className="w-full"
          >
            <Heart className={`h-4 w-4 mr-2 ${filterFavorites ? 'fill-current' : ''}`} />
            {filterFavorites ? 'Showing Favorites' : 'Show Favorites'}
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Templates</p>
              <p className="text-2xl font-bold text-gray-900">{cartItems.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <Heart className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Favorites</p>
              <p className="text-2xl font-bold text-gray-900">
                {cartItems.filter(item => item.is_favorite).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <FolderIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Folders</p>
              <p className="text-2xl font-bold text-gray-900">{folders.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Cart Items */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-48 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {cartItems.length === 0 ? 'Your cart is empty' : 'No templates match your filters'}
          </h3>
          <p className="text-gray-500 mb-6">
            {cartItems.length === 0
              ? 'Browse templates and add them to your cart'
              : 'Try adjusting your search or filters'}
          </p>
          <Button
            onClick={() => router.push('/dashboard/templates')}
            variant="outline"
          >
            Browse Templates
          </Button>
        </Card>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            Showing {filteredItems.length} template{filteredItems.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onRemove={handleRemove}
                onUpdate={handleUpdate}
                onPreview={handlePreview}
                onUseTemplate={handleUseTemplate}
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
        isInCart={true}
      />
    </div>
  )
}
