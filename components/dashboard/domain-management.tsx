"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Plus, Globe, CheckCircle, Clock, XCircle, Star, Copy, Trash2, RefreshCw } from 'lucide-react'

interface DomainDNSRecord {
  type: string
  name: string
  value: string
  priority?: number
}

interface UserDomain {
  id: string
  user_id: string
  domain_name: string
  resend_domain_id: string | null
  status: 'pending' | 'verified' | 'failed'
  verification_error: string | null
  dns_records: DomainDNSRecord[]
  is_default: boolean
  created_at: string
  updated_at: string
  verified_at: string | null
  last_verified_at: string | null
}

export function DomainManagement() {
  const [domains, setDomains] = useState<UserDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newDomain, setNewDomain] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<UserDomain | null>(null)
  const [showDNSDialog, setShowDNSDialog] = useState(false)

  useEffect(() => {
    fetchDomains()
  }, [])

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/user/domains')
      const data = await response.json()

      if (data.success) {
        setDomains(data.domains)
      } else {
        toast.error('Failed to fetch domains')
      }
    } catch (error) {
      toast.error('Error fetching domains')
    } finally {
      setLoading(false)
    }
  }

  const addDomain = async () => {
    if (!newDomain.trim()) {
      toast.error('Please enter a domain name')
      return
    }

    setAdding(true)
    try {
      const response = await fetch('/api/user/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain: newDomain.trim() }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Domain added successfully')
        setNewDomain('')
        setShowAddDialog(false)
        fetchDomains()

        if (data.dnsRecords && data.dnsRecords.length > 0) {
          setSelectedDomain(data.domain)
          setShowDNSDialog(true)
        }
      } else {
        toast.error(data.error || 'Failed to add domain')
      }
    } catch (error) {
      toast.error('Error adding domain')
    } finally {
      setAdding(false)
    }
  }

  const verifyDomain = async (domainId: string) => {
    setVerifying(domainId)
    try {
      const response = await fetch(`/api/user/domains/${domainId}/verify`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        if (data.verified) {
          toast.success('Domain verified successfully!')
        } else {
          toast.info('Domain verification is still pending. Please check your DNS records.')
        }
        fetchDomains()
      } else {
        toast.error(data.error || 'Failed to verify domain')
      }
    } catch (error) {
      toast.error('Error verifying domain')
    } finally {
      setVerifying(null)
    }
  }

  const setDefaultDomain = async (domainId: string) => {
    try {
      const response = await fetch(`/api/user/domains/${domainId}/set-default`, {
        method: 'PATCH',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Default domain updated')
        fetchDomains()
      } else {
        toast.error(data.error || 'Failed to set default domain')
      }
    } catch (error) {
      toast.error('Error setting default domain')
    }
  }

  const deleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) {
      return
    }

    try {
      const response = await fetch(`/api/user/domains/${domainId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Domain deleted successfully')
        fetchDomains()
      } else {
        toast.error(data.error || 'Failed to delete domain')
      }
    } catch (error) {
      toast.error('Error deleting domain')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="secondary" className="bg-success/10 text-success">Verified</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/10 text-warning">Pending</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Domain Management</CardTitle>
          <CardDescription>Loading your domains...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Domain Management
              </CardTitle>
              <CardDescription>
                Add and verify custom domains to send emails from your own domain
              </CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Domain
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Domain</DialogTitle>
                  <DialogDescription>
                    Enter your domain name to start the verification process
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="domain">Domain Name</Label>
                    <Input
                      id="domain"
                      placeholder="example.com"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addDomain()}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addDomain} disabled={adding}>
                    {adding ? 'Adding...' : 'Add Domain'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {domains.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No domains added</h3>
              <p className="text-muted-foreground mb-4">
                Add a custom domain to send emails from your own domain
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Domain
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {domains.map((domain) => (
                <Card key={domain.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(domain.status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{domain.domain_name}</h3>
                            {domain.is_default && (
                              <Badge variant="secondary" className="bg-primary/10 text-primary">
                                <Star className="h-3 w-3 mr-1" />
                                Default
                              </Badge>
                            )}
                            {getStatusBadge(domain.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Added {new Date(domain.created_at).toLocaleDateString()}
                            {domain.verified_at && (
                              <span className="ml-2">
                                • Verified {new Date(domain.verified_at).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                          {domain.verification_error && (
                            <p className="text-sm text-destructive mt-1">
                              Error: {domain.verification_error}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {domain.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => verifyDomain(domain.id)}
                            disabled={verifying === domain.id}
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${verifying === domain.id ? 'animate-spin' : ''}`} />
                            {verifying === domain.id ? 'Verifying...' : 'Verify'}
                          </Button>
                        )}
                        {domain.dns_records.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDomain(domain)
                              setShowDNSDialog(true)
                            }}
                          >
                            View DNS
                          </Button>
                        )}
                        {domain.status === 'verified' && !domain.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDefaultDomain(domain.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteDomain(domain.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DNS Setup Dialog */}
      <Dialog open={showDNSDialog} onOpenChange={setShowDNSDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>DNS Setup Instructions</DialogTitle>
            <DialogDescription>
              Add these DNS records to your domain to complete verification
            </DialogDescription>
          </DialogHeader>
          {selectedDomain && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Add the following DNS records to your domain's DNS settings.
                  Changes may take up to 48 hours to propagate.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {selectedDomain.dns_records.map((record, index) => (
                  <Card key={index} className="border">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">TYPE</Label>
                          <div className="font-mono text-sm">{record.type}</div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">NAME</Label>
                          <div className="font-mono text-sm break-all">{record.name}</div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium text-muted-foreground">VALUE</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(record.value)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="font-mono text-sm break-all bg-muted p-2 rounded">
                            {record.value}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Next Steps:</h4>
                <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground">
                  <li>Add all DNS records above to your domain's DNS settings</li>
                  <li>Wait for DNS propagation (usually 5-30 minutes, max 48 hours)</li>
                  <li>Click "Verify" button to check domain verification status</li>
                  <li>Once verified, you can use this domain for sending emails</li>
                </ol>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDNSDialog(false)}>
              Close
            </Button>
            {selectedDomain && selectedDomain.status === 'pending' && (
              <Button
                onClick={() => {
                  setShowDNSDialog(false)
                  verifyDomain(selectedDomain.id)
                }}
                disabled={verifying === selectedDomain.id}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${verifying === selectedDomain.id ? 'animate-spin' : ''}`} />
                Verify Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}