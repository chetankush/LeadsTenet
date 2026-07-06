import { DomainManagement } from '@/components/dashboard/domain-management'

export default function DomainsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Domain Management</h1>
          <p className="text-muted-foreground mt-2">
            Add and verify custom domains to send emails from your own domain
          </p>
        </div>

        <DomainManagement />
      </div>
    </div>
  )
}