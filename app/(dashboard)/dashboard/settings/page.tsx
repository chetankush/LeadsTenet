'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { 
  Settings as SettingsIcon, 
  Mail, 
  Bell, 
  Shield, 
  Palette,
  Save,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface SettingsData {
  emailSettings: {
    defaultFromEmail: string
    defaultFromName: string
    emailSignature: string
    replyToEmail: string
  }
  notifications: {
    emailSent: boolean
    campaignCompleted: boolean
    monthlyReport: boolean
    systemUpdates: boolean
  }
  privacy: {
    dataRetention: string
    analyticsTracking: boolean
    thirdPartyIntegrations: boolean
  }
  appearance: {
    theme: 'light' | 'dark' | 'system'
    timezone: string
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    emailSettings: {
      defaultFromEmail: 'onboarding@resend.dev',
      defaultFromName: 'LeadsTeNet',
      emailSignature: '',
      replyToEmail: ''
    },
    notifications: {
      emailSent: true,
      campaignCompleted: true,
      monthlyReport: false,
      systemUpdates: true
    },
    privacy: {
      dataRetention: '90',
      analyticsTracking: true,
      thirdPartyIntegrations: false
    },
    appearance: {
      theme: 'light',
      timezone: 'UTC'
    }
  })
  
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleInputChange = (section: keyof SettingsData, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      // In a real app, you'd call your API to save settings
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      toast.success('Settings saved successfully!')
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    // Reset to default values
    setSettings({
      emailSettings: {
        defaultFromEmail: 'onboarding@resend.dev',
        defaultFromName: 'LeadsTeNet',
        emailSignature: '',
        replyToEmail: ''
      },
      notifications: {
        emailSent: true,
        campaignCompleted: true,
        monthlyReport: false,
        systemUpdates: true
      },
      privacy: {
        dataRetention: '90',
        analyticsTracking: true,
        thirdPartyIntegrations: false
      },
      appearance: {
        theme: 'light',
        timezone: 'UTC'
      }
    })
    setHasChanges(true)
    toast.success('Settings reset to defaults')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account preferences and application settings</p>
        </div>
        
        {hasChanges && (
          <div className="flex space-x-2">
            <Button onClick={handleReset} variant="outline" disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {/* Email Settings */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Mail className="h-5 w-5 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900">Email Settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default From Email
            </label>
            <input
              type="email"
              value={settings.emailSettings.defaultFromEmail}
              onChange={(e) => handleInputChange('emailSettings', 'defaultFromEmail', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default From Name
            </label>
            <input
              type="text"
              value={settings.emailSettings.defaultFromName}
              onChange={(e) => handleInputChange('emailSettings', 'defaultFromName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reply-To Email
            </label>
            <input
              type="email"
              value={settings.emailSettings.replyToEmail}
              onChange={(e) => handleInputChange('emailSettings', 'replyToEmail', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={settings.appearance.timezone}
              onChange={(e) => handleInputChange('appearance', 'timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Signature
          </label>
          <textarea
            value={settings.emailSettings.emailSignature}
            onChange={(e) => handleInputChange('emailSettings', 'emailSignature', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional email signature to append to all emails"
          />
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Bell className="h-5 w-5 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Email Sent Notifications</h3>
              <p className="text-sm text-gray-600">Get notified when emails are successfully sent</p>
            </div>
            <Switch
              checked={settings.notifications.emailSent}
              onCheckedChange={(checked) => handleInputChange('notifications', 'emailSent', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Campaign Completed</h3>
              <p className="text-sm text-gray-600">Get notified when campaigns finish processing</p>
            </div>
            <Switch
              checked={settings.notifications.campaignCompleted}
              onCheckedChange={(checked) => handleInputChange('notifications', 'campaignCompleted', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Monthly Reports</h3>
              <p className="text-sm text-gray-600">Receive monthly performance summaries</p>
            </div>
            <Switch
              checked={settings.notifications.monthlyReport}
              onCheckedChange={(checked) => handleInputChange('notifications', 'monthlyReport', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">System Updates</h3>
              <p className="text-sm text-gray-600">Get notified about new features and updates</p>
            </div>
            <Switch
              checked={settings.notifications.systemUpdates}
              onCheckedChange={(checked) => handleInputChange('notifications', 'systemUpdates', checked)}
            />
          </div>
        </div>
      </Card>

      {/* Privacy & Security */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Shield className="h-5 w-5 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900">Privacy & Security</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Retention Period
            </label>
            <select
              value={settings.privacy.dataRetention}
              onChange={(e) => handleInputChange('privacy', 'dataRetention', e.target.value)}
              className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="180">6 months</option>
              <option value="365">1 year</option>
              <option value="-1">Keep forever</option>
            </select>
            <p className="text-sm text-gray-600 mt-1">
              How long to keep your campaign data and email logs
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Analytics Tracking</h3>
              <p className="text-sm text-gray-600">Allow us to collect anonymous usage data to improve the service</p>
            </div>
            <Switch
              checked={settings.privacy.analyticsTracking}
              onCheckedChange={(checked) => handleInputChange('privacy', 'analyticsTracking', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Third-party Integrations</h3>
              <p className="text-sm text-gray-600">Allow connections to external services and APIs</p>
            </div>
            <Switch
              checked={settings.privacy.thirdPartyIntegrations}
              onCheckedChange={(checked) => handleInputChange('privacy', 'thirdPartyIntegrations', checked)}
            />
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Palette className="h-5 w-5 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900">Appearance</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Theme Preference
          </label>
          <select
            value={settings.appearance.theme}
            onChange={(e) => handleInputChange('appearance', 'theme', e.target.value)}
            className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
          <p className="text-sm text-gray-600 mt-1">
            Choose your preferred color scheme
          </p>
        </div>
      </Card>

      {/* Save Button (Fixed) */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button onClick={handleSave} disabled={loading} className="shadow-lg">
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  )
}