import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeviceStatus } from '@/constants/status'
import { NavigationTracker } from '@/components/layout/NavigationTracker'
import { mockDevices } from '@/lib/mock/devices.mock'
import { DeviceDetailTabs } from './_components/DeviceDetailTabs'

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

  // Fallback to default
  return {
    id,
    serialNumber: 'HP-LJ-2024-001',
    model: 'HP LaserJet Pro MFP M428fdn',
    location: 'Floor 3, Room 301',
    status: DeviceStatus.ACTIVE,
    customerId: 'customer-1',
    totalPagesUsed: 45230,
    lastMaintenanceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    nextMaintenanceDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export default async function DeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const device = await getDevice(id)

  if (!device) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Track navigation for sidebar */}
      <NavigationTracker deviceId={device.id} deviceName={device.serialNumber} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/customer-admin/devices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{device.serialNumber}</h1>
            <p className="text-muted-foreground">{device.model}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <AlertCircle className="mr-2 h-4 w-4" />
            Yêu cầu dịch vụ
          </Button>
          <Button asChild>
            <Link href={`/customer-admin/devices/${device.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Chỉnh sửa thiết bị
            </Link>
          </Button>
        </div>
      </div>

      <DeviceDetailTabs device={device} />
    </div>
  )
}
