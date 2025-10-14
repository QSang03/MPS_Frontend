import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DeviceForm } from '../_components/DeviceForm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function NewDevicePage() {
  let session = await getSession()

  // 🔧 DEV MODE: Use mock session
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/customer-admin/devices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Device</h1>
          <p className="text-muted-foreground">Add a new device to your system</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Device Information</CardTitle>
          <CardDescription>Enter the basic information for the new device</CardDescription>
        </CardHeader>
        <CardContent>
          <DeviceForm mode="create" customerId={session!.customerId} />
        </CardContent>
      </Card>
    </div>
  )
}
