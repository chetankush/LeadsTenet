'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Mail,
  Building,
  Calendar,
  Crown,
  Edit,
  Save,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  company_name: string | null
  subscription_tier: 'free' | 'pro' | 'enterprise'
  subscription_status: string
  emails_per_month: number
  campaigns_limit: number
  leads_per_upload: number
  created_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: ''
  })

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('You are not signed in')
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      const resolved: UserProfile = {
        id: user.id,
        email: data?.email || user.email || '',
        full_name: data?.full_name ?? (user.user_metadata?.full_name || null),
        company_name: data?.company_name ?? null,
        subscription_tier: data?.subscription_tier || 'free',
        subscription_status: data?.subscription_status || 'active',
        emails_per_month: data?.emails_per_month ?? 100,
        campaigns_limit: data?.campaigns_limit ?? 5,
        leads_per_upload: data?.leads_per_upload ?? 500,
        created_at: data?.created_at || user.created_at
      }

      setProfile(resolved)
      setFormData({
        full_name: resolved.full_name || '',
        company_name: resolved.company_name || ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return
    try {
      setSaving(true)
      const supabase = createClient()
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name || null,
          company_name: formData.company_name || null
        })
        .eq('id', profile.id)

      if (error) throw error

      setProfile({
        ...profile,
        full_name: formData.full_name || null,
        company_name: formData.company_name || null
      })
      toast.success('Profile updated successfully!')
      setEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || '',
      company_name: profile?.company_name || ''
    })
    setEditing(false)
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-800'
      case 'pro': return 'bg-blue-100 text-blue-800'
      case 'enterprise': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTierIcon = (tier: string) => {
    return tier !== 'free' ? <Crown className="h-4 w-4 mr-1" /> : null
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>
        <div className="text-center py-12">
          <div className="text-gray-500">Loading profile...</div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>
        <div className="text-center py-12">
          <div className="text-red-500">Failed to load profile</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>
      </div>

      {/* Profile Information */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
          {!editing ? (
            <Button onClick={() => setEditing(true)} variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button onClick={handleSave} size="sm" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm" disabled={saving}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Avatar and Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {profile.full_name || 'Anonymous User'}
                </h3>
                <p className="text-gray-600">{profile.email}</p>
              </div>
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your company name"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {profile.full_name || 'Name not set'}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {profile.company_name || 'Company not set'}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    Member since {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Account Details */}
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">Email Address</span>
              </div>
              <p className="font-medium">{profile.email}</p>
              <p className="text-xs text-gray-500">
                Email managed by your authentication provider
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Subscription Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Subscription & Limits</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              {getTierIcon(profile.subscription_tier)}
              <Badge className={getTierColor(profile.subscription_tier)}>
                {profile.subscription_tier.toUpperCase()}
              </Badge>
              <span className="text-sm text-gray-500">
                • {profile.subscription_status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Emails per month</span>
                <span className="font-semibold">{profile.emails_per_month}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Campaigns limit</span>
                <span className="font-semibold">
                  {profile.campaigns_limit === -1 ? 'Unlimited' : profile.campaigns_limit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Leads per upload</span>
                <span className="font-semibold">{profile.leads_per_upload}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {profile.subscription_tier === 'free' && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Upgrade to Pro</h3>
                <p className="text-blue-700 text-sm mb-3">
                  Get more emails, campaigns, and advanced features
                </p>
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade Now
                </Button>
              </div>
            )}

            <div className="text-sm text-gray-500">
              <p>Need more? Contact us for enterprise pricing and custom solutions.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-200">
        <h2 className="text-xl font-semibold text-red-900 mb-4">Account Management</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
            <div>
              <h3 className="font-medium text-red-900">Delete Account</h3>
              <p className="text-sm text-red-700">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="outline" size="sm" className="border-red-300 text-red-700">
              Delete Account
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
