import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { ServiceRequestStatus, Priority } from '@/constants/status'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Mock data
const mockRequests = [
  {
    id: '1',
    deviceId: 'device-1',
    description: 'Printer not responding to print jobs',
    priority: Priority.HIGH,
    status: ServiceRequestStatus.IN_PROGRESS,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    deviceId: 'device-2',
    description: 'Low toner warning',
    priority: Priority.NORMAL,
    status: ServiceRequestStatus.RESOLVED,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

const statusColors = {
  [ServiceRequestStatus.NEW]: 'bg-blue-100 text-blue-800',
  [ServiceRequestStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
  [ServiceRequestStatus.RESOLVED]: 'bg-green-100 text-green-800',
  [ServiceRequestStatus.CLOSED]: 'bg-gray-100 text-gray-800',
}

export default function MyRequestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Service Requests</h1>
          <p className="text-muted-foreground">Track your service requests</p>
        </div>
        <Button asChild>
          <Link href="/customer-admin/service-requests/new">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        {mockRequests.map((request) => (
          <Card key={request.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">Request #{request.id.slice(0, 8)}</p>
                      <Badge className={statusColors[request.status]} variant="secondary">
                        {request.status}
                      </Badge>
                      <Badge variant="outline">{request.priority}</Badge>
                    </div>
                    <p className="text-sm">{request.description}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatRelativeTime(request.createdAt)}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/customer-admin/service-requests/${request.id}`}>View Details</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
