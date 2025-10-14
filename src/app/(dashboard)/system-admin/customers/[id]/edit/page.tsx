import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomerForm } from '../../_components/CustomerForm'

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

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await getCustomer(id)

  if (!customer) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/system-admin/customers/${customer.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Customer</h1>
          <p className="text-muted-foreground">{customer.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
          <CardDescription>Update the customer information</CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerForm mode="edit" initialData={customer} />
        </CardContent>
      </Card>
    </div>
  )
}
