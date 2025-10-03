"use client"

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Globe, Plus, Star } from 'lucide-react'
import Link from 'next/link'

interface UserDomain {
  id: string
  domain_name: string
  status: 'pending' | 'verified' | 'failed'
  is_default: boolean
}

interface DomainSelectorProps {
  value?: string
  onValueChange: (domainId: string) => void
  placeholder?: string
  className?: string
}

export function DomainSelector({
  value,
  onValueChange,
  placeholder = "Select sending domain...",
  className
}: DomainSelectorProps) {
  const [domains, setDomains] = useState<UserDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [defaultDomain, setDefaultDomain] = useState<UserDomain | null>(null)

  useEffect(() => {
    fetchDomains()
  }, [])

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/user/domains')
      const data = await response.json()

      if (data.success) {
        const verifiedDomains = data.domains.filter((d: UserDomain) => d.status === 'verified')
        setDomains(verifiedDomains)

        const defaultDom = verifiedDomains.find((d: UserDomain) => d.is_default)
        setDefaultDomain(defaultDom || null)

        // Auto-select default domain if no value is set
        if (!value && defaultDom) {
          onValueChange(defaultDom.id)
        }
      }
    } catch (error) {
      console.error('Error fetching domains:', error)
    } finally {
      setLoading(false)
    }
  }

  const verifiedDomains = domains.filter(d => d.status === 'verified')

  if (loading) {
    return (
      <div className={className}>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Loading domains..." />
          </SelectTrigger>
        </Select>
      </div>
    )
  }

  if (verifiedDomains.length === 0) {
    return (
      <div className={className}>
        <Alert>
          <Globe className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>No verified domains available. Add a domain to send from your custom email address.</span>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/domains">
                <Plus className="h-4 w-4 mr-2" />
                Add Domain
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className={className}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {verifiedDomains.map((domain) => (
            <SelectItem key={domain.id} value={domain.id}>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>{domain.domain_name}</span>
                {domain.is_default && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Default
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface DomainFromEmailInputProps {
  domainId?: string
  localPart: string
  onLocalPartChange: (localPart: string) => void
  className?: string
}

export function DomainFromEmailInput({
  domainId,
  localPart,
  onLocalPartChange,
  className
}: DomainFromEmailInputProps) {
  const [domains, setDomains] = useState<UserDomain[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDomains()
  }, [])

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/user/domains')
      const data = await response.json()

      if (data.success) {
        setDomains(data.domains.filter((d: UserDomain) => d.status === 'verified'))
      }
    } catch (error) {
      console.error('Error fetching domains:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedDomain = domains.find(d => d.id === domainId)

  if (loading || !selectedDomain) {
    return (
      <div className={className}>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="noreply"
            value={localPart}
            onChange={(e) => onLocalPartChange(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <span className="text-gray-500">@</span>
          <span className="text-gray-400">
            {loading ? 'loading...' : 'select-domain.com'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="noreply"
          value={localPart}
          onChange={(e) => onLocalPartChange(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-gray-500">@</span>
        <span className="font-medium text-gray-700">
          {selectedDomain.domain_name}
        </span>
      </div>
      <p className="text-sm text-gray-500 mt-1">
        Full email: {localPart || 'noreply'}@{selectedDomain.domain_name}
      </p>
    </div>
  )
}