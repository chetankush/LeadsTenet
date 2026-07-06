'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Mail, 
  Users, 
  TrendingUp, 
  Calendar,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react'

interface Campaign {
  id: string
  name: string
  description: string
  status: string
  from_email: string
  from_name: string
  total_leads: number
  emails_sent: number
  emails_delivered: number
  emails_opened: number
  created_at: string
  updated_at: string
}

interface Lead {
  id: string
  name: string
  email: string
  company: string
  status: string
  created_at: string
}

export default function CampaignDetailPage() {
  const router = useRouter()
  const params = useParams()
  const campaignId = params?.id as string

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (campaignId) {
      fetchCampaignDetails()
    }
  }, [campaignId])

  const fetchCampaignDetails = async () => {
    try {
      setLoading(true)
      
      // Fetch campaign details
      const campaignResponse = await fetch(`/api/campaigns/${campaignId}`)
      if (!campaignResponse.ok) {
        throw new Error('Campaign not found')
      }
      
      const campaignData = await campaignResponse.json()
      setCampaign(campaignData.campaign)
      
      // For now, we'll show mock leads data
      // In a real app, you'd fetch leads from /api/campaigns/${campaignId}/leads
      const mockLeads: Lead[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          company: 'Tech Corp',
          status: 'sent',
          created_at: new Date().toISOString()
        },
        {
          id: '2', 
          name: 'Jane Smith',
          email: 'jane@company.com',
          company: 'Business Inc',
          status: 'delivered',
          created_at: new Date().toISOString()
        }
      ]
      setLeads(mockLeads)
      
      setError(null)
    } catch (err) {
      console.error('Error fetching campaign:', err)
      setError(err instanceof Error ? err.message : 'Failed to load campaign')
      setCampaign(null)
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success'
      case 'draft': return 'bg-muted text-muted-foreground'
      case 'paused': return 'bg-warning/10 text-warning'
      case 'completed': return 'bg-primary/10 text-primary'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-success/10 text-success'
      case 'delivered': return 'bg-success/10 text-success'
      case 'opened': return 'bg-primary/10 text-primary'
      case 'failed': return 'bg-destructive/10 text-destructive'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Loading...</h1>
        </div>
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading campaign details...</div>
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Campaign Not Found</h1>
        </div>
        <div className="text-center py-12">
          <div className="text-destructive">Error: {error}</div>
          <Button onClick={() => router.push('/dashboard/campaigns')} className="mt-4">
            View All Campaigns
          </Button>
        </div>
      </div>
    )
  }

  const openRate = campaign.emails_delivered > 0 
    ? Math.round((campaign.emails_opened / campaign.emails_delivered) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-foreground">{campaign.name}</h1>
              <Badge className={getStatusColor(campaign.status)}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </Badge>
            </div>
            {campaign.description && (
              <p className="text-muted-foreground mt-2">{campaign.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchCampaignDetails}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-muted rounded-lg">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Leads</p>
              <p className="text-2xl font-bold text-foreground">{campaign.total_leads}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-muted rounded-lg">
              <Mail className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Emails Sent</p>
              <p className="text-2xl font-bold text-foreground">{campaign.emails_sent}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-muted rounded-lg">
              <TrendingUp className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Delivered</p>
              <p className="text-2xl font-bold text-foreground">{campaign.emails_delivered}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-muted rounded-lg">
              <Eye className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Open Rate</p>
              <p className="text-2xl font-bold text-foreground">{openRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Campaign Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Campaign Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">From Email</p>
              <p className="text-foreground">{campaign.from_email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">From Name</p>
              <p className="text-foreground">{campaign.from_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-foreground">{new Date(campaign.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-foreground">{new Date(campaign.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Performance Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Rate</span>
              <span className="font-semibold">
                {campaign.emails_sent > 0 
                  ? Math.round((campaign.emails_delivered / campaign.emails_sent) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Open Rate</span>
              <span className="font-semibold">{openRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Opened</span>
              <span className="font-semibold">{campaign.emails_opened}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Leads List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Campaign Leads</h2>
          <Badge variant="outline">
            {leads.length} leads
          </Badge>
        </div>

        {leads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No leads found for this campaign
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Added
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-accent">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">{lead.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{lead.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{lead.company}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getLeadStatusColor(lead.status)}>
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}