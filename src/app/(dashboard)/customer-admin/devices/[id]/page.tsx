import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer, MapPin, Calendar, Activity, Pencil, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate, formatNumber } from '@/lib/utils/formatters'
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

const statusColorMap: Record<DeviceStatus, string> = {
  [DeviceStatus.ACTIVE]: 'bg-green-100 text-green-800',
  [DeviceStatus.INACTIVE]: 'bg-gray-100 text-gray-800',
  [DeviceStatus.ERROR]: 'bg-red-100 text-red-800',
  [DeviceStatus.MAINTENANCE]: 'bg-yellow-100 text-yellow-800',
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
              Back
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
            Request Service
          </Button>
          <Button asChild>
            <Link href={`/customer-admin/devices/${device.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Device
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage History</TabsTrigger>
          <TabsTrigger value="service">Service History</TabsTrigger>
          <TabsTrigger value="consumables">Consumables</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Device Information */}
            <Card>
              <CardHeader>
                <CardTitle>Device Information</CardTitle>
                <CardDescription>Basic device details and specifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Printer className="text-muted-foreground mt-0.5 h-5 w-5" />
                  <div className="flex-1">
                    <p className="text-muted-foreground text-sm">Serial Number</p>
                    <p className="font-mono font-medium">{device.serialNumber}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <Printer className="text-muted-foreground mt-0.5 h-5 w-5" />
                  <div className="flex-1">
                    <p className="text-muted-foreground text-sm">Model</p>
                    <p className="font-medium">{device.model}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <MapPin className="text-muted-foreground mt-0.5 h-5 w-5" />
                  <div className="flex-1">
                    <p className="text-muted-foreground text-sm">Location</p>
                    <p className="font-medium">{device.location}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <Activity className="text-muted-foreground mt-0.5 h-5 w-5" />
                  <div className="flex-1">
                    <p className="text-muted-foreground text-sm">Status</p>
                    <Badge className={statusColorMap[device.status]} variant="secondary">
                      {device.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
                <CardDescription>Device usage and maintenance info</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Printer className="text-muted-foreground mt-0.5 h-5 w-5" />
                  <div className="flex-1">
                    <p className="text-muted-foreground text-sm">Total Pages Used</p>
                    <p className="text-2xl font-bold">{formatNumber(device.totalPagesUsed)}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <Calendar className="text-muted-foreground mt-0.5 h-5 w-5" />
                  <div className="flex-1">
                    <p className="text-muted-foreground text-sm">Last Maintenance</p>
                    <p className="font-medium">
                      {device.lastMaintenanceDate
                        ? formatDate(device.lastMaintenanceDate)
                        : 'Never'}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <Calendar className="text-muted-foreground mt-0.5 h-5 w-5" />
                  <div className="flex-1">
                    <p className="text-muted-foreground text-sm">Next Maintenance</p>
                    <p className="font-medium">
                      {device.nextMaintenanceDate
                        ? formatDate(device.nextMaintenanceDate)
                        : 'Not scheduled'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Usage History</CardTitle>
              <CardDescription>Historical usage data for this device</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground flex h-64 items-center justify-center rounded-md border-2 border-dashed">
                <p>Usage history chart will be implemented here...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service">
          <Card>
            <CardHeader>
              <CardTitle>Service History</CardTitle>
              <CardDescription>Past service requests and resolutions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground flex h-64 items-center justify-center rounded-md border-2 border-dashed">
                <p>Service history will be implemented here...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consumables">
          <Card>
            <CardHeader>
              <CardTitle>Consumables</CardTitle>
              <CardDescription>Toner levels and supply status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground flex h-64 items-center justify-center rounded-md border-2 border-dashed">
                <p>Consumables tracking will be implemented here...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
