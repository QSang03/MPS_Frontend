import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DeviceForm } from '../../_components/DeviceForm'
import { DeviceStatus } from '@/constants/status'
import { NavigationTracker } from '@/components/layout/NavigationTracker'
import { mockDevices } from '@/lib/mock/devices.mock'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Mock data - will be replaced with real API call
async function getDevice(id: string) {
  await new Promise((resolve) => setTimeout(resolve, 100))

  // Try to find from mock data first
  const mockDevice = mockDevices.find((d) => d.id === id)
  if (mockDevice) {
    return mockDevice
  }

  return {
    id,
    serialNumber: 'HP-LJ-2024-001',
    model: 'HP LaserJet Pro MFP M428fdn',
    location: 'Floor 3, Room 301',
    status: DeviceStatus.ACTIVE,
    customerId: 'customer-1',
    totalPagesUsed: 45230,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export default async function EditDevicePage({ params }: { params: Promise<{ id: string }> }) {
  let session = await getSession()

  // 🔧 DEV MODE: Use mock session
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  const { id } = await params
  const device = await getDevice(id)

  if (!device) {
    notFound()
  }

  // Check customer isolation
  if (session && device.customerId !== session.customerId && session.role !== 'SystemAdmin') {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Track navigation for sidebar */}
      <NavigationTracker deviceId={device.id} deviceName={device.serialNumber} />

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/customer-admin/devices/${device.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Chỉnh sửa thiết bị</h1>
          <p className="text-muted-foreground">{device.serialNumber}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin thiết bị</CardTitle>
          <CardDescription>Cập nhật thông tin thiết bị</CardDescription>
        </CardHeader>
        <CardContent>
          <DeviceForm mode="edit" customerId={session!.customerId} initialData={device} />
        </CardContent>
      </Card>
    </div>
  )
}
