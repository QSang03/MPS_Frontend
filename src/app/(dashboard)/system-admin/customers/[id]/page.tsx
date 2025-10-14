import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Calendar, MapPin, Pencil, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDate } from '@/lib/utils/formatters'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Mock data - will be replaced with real API call
async function getCustomer(id: string) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 100))

  // Mock customer data
  return {
    id,
    name: 'Acme Corporation',
    address: '123 Business Street, Tech City, TC 12345',
    deviceCount: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await getCustomer(id)

  if (!customer) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/system-admin/customers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <p className="text-muted-foreground">Customer Details</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/system-admin/customers/${customer.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Customer
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Customer details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Building2 className="text-muted-foreground mt-0.5 h-5 w-5" />
              <div className="flex-1">
                <p className="text-muted-foreground text-sm">Customer Name</p>
                <p className="font-medium">{customer.name}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <MapPin className="text-muted-foreground mt-0.5 h-5 w-5" />
              <div className="flex-1">
                <p className="text-muted-foreground text-sm">Address</p>
                <p className="font-medium">{customer.address}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <Printer className="text-muted-foreground mt-0.5 h-5 w-5" />
              <div className="flex-1">
                <p className="text-muted-foreground text-sm">Tổng thiết bị</p>
                <Badge variant="secondary" className="mt-1">
                  {customer.deviceCount} thiết bị
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Timestamps and metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="text-muted-foreground mt-0.5 h-5 w-5" />
              <div className="flex-1">
                <p className="text-muted-foreground text-sm">Created At</p>
                <p className="font-medium">{formatDate(customer.createdAt, 'PPP')}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <Calendar className="text-muted-foreground mt-0.5 h-5 w-5" />
              <div className="flex-1">
                <p className="text-muted-foreground text-sm">Last Updated</p>
                <p className="font-medium">{formatDate(customer.updatedAt, 'PPP')}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <Building2 className="text-muted-foreground mt-0.5 h-5 w-5" />
              <div className="flex-1">
                <p className="text-muted-foreground text-sm">Customer ID</p>
                <p className="font-mono text-sm">{customer.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Devices Section - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Devices</CardTitle>
          <CardDescription>List of devices assigned to this customer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex h-32 items-center justify-center rounded-md border-2 border-dashed">
            <p>Device list will be implemented here...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
