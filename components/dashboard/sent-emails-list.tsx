"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Mail, Eye, User, Building2, Calendar, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface EmailLog {
  id: string
  subject: string
  body_text: string
  body_html: string | null
  from_email: string
  to_email: string
  status: string
  sent_at: string
  delivered_at: string | null
  opened_at: string | null
  leads: {
    name: string
    email: string
    company: string
  }
}

interface SentEmailsListProps {
  campaignId: string
}

export function SentEmailsList({ campaignId }: SentEmailsListProps) {
  const [emails, setEmails] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchSentEmails()
  }, [campaignId])

  const fetchSentEmails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}/emails`)
      const data = await response.json()

      if (data.success) {
        setEmails(data.emails)
      } else {
        toast.error('Failed to fetch sent emails')
      }
    } catch (error) {
      console.error('Error fetching sent emails:', error)
      toast.error('Error loading sent emails')
    } finally {
      setLoading(false)
    }
  }

  const viewEmail = (email: EmailLog) => {
    setSelectedEmail(email)
    setShowPreview(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'opened':
        return <Eye className="h-4 w-4 text-blue-500" />
      case 'failed':
      case 'bounced':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">{status}</Badge>
      case 'opened':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">{status}</Badge>
      case 'failed':
      case 'bounced':
        return <Badge variant="destructive">{status}</Badge>
      case 'queued':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{status}</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sent Emails</CardTitle>
          <CardDescription>Loading sent emails...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Sent Emails
              </CardTitle>
              <CardDescription>
                View all emails sent in this campaign
              </CardDescription>
            </div>
            <Badge variant="outline">
              {emails.length} {emails.length === 1 ? 'email' : 'emails'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {emails.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                No emails sent yet
              </h3>
              <p className="text-gray-500">
                Emails sent in this campaign will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {emails.map((email) => (
                <Card key={email.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* Email Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(email.status)}
                          <h3 className="font-semibold text-gray-900 truncate">
                            {email.subject}
                          </h3>
                          {getStatusBadge(email.status)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="h-4 w-4" />
                            <div className="truncate">
                              <span className="font-medium">{email.leads.name}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{email.to_email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Building2 className="h-4 w-4" />
                            <span className="truncate">{email.leads.company}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          Sent: {new Date(email.sent_at).toLocaleString()}
                          {email.opened_at && (
                            <span className="ml-3 text-blue-600 font-medium">
                              • Opened: {new Date(email.opened_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* View Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewEmail(email)}
                        className="flex-shrink-0"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Content</DialogTitle>
            <DialogDescription>
              View the personalized email that was sent
            </DialogDescription>
          </DialogHeader>

          {selectedEmail && (
            <div className="space-y-4">
              {/* Recipient Info */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 font-medium">To</p>
                      <p className="text-gray-900">{selectedEmail.leads.name}</p>
                      <p className="text-gray-600 text-xs">{selectedEmail.to_email}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">Company</p>
                      <p className="text-gray-900">{selectedEmail.leads.company}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">Status</p>
                      <div className="mt-1">{getStatusBadge(selectedEmail.status)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Email Content */}
              <div className="space-y-3">
                {/* Subject */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Subject</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-semibold text-gray-900">{selectedEmail.subject}</p>
                  </div>
                </div>

                {/* From */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">From</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900">{selectedEmail.from_email}</p>
                  </div>
                </div>

                {/* Body */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Email Body</label>
                  <div className="mt-1 p-4 bg-white rounded-lg border-2 border-gray-200">
                    <pre className="whitespace-pre-wrap font-sans text-gray-900 leading-relaxed">
                      {selectedEmail.body_text}
                    </pre>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Sent At</p>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedEmail.sent_at).toLocaleString()}
                    </p>
                  </div>
                  {selectedEmail.opened_at && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs font-medium text-blue-600 uppercase mb-1">Opened At</p>
                      <p className="text-sm text-blue-900">
                        {new Date(selectedEmail.opened_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
