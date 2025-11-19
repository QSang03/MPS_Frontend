'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatRelativeTime } from '@/lib/utils/formatters'
import { PurchaseRequestStatus, Priority } from '@/constants/status'
import { Check, X, Clock, Truck, PackageCheck } from 'lucide-react'

interface PurchaseRequestListProps {
  customerId: string
  status?: PurchaseRequestStatus
}

// Mock data
const mockRequests = [
  {
    id: '1',
    itemName: 'HP 58A Toner Cartridge',
    quantity: 10,
    estimatedCost: 850,
    priority: Priority.NORMAL,
    status: PurchaseRequestStatus.PENDING,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    itemName: 'A4 Paper (500 sheets)',
    quantity: 50,
    estimatedCost: 250,
    priority: Priority.HIGH,
    status: PurchaseRequestStatus.APPROVED,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    itemName: 'Maintenance Kit',
    quantity: 5,
    estimatedCost: 1200,
    priority: Priority.NORMAL,
    status: PurchaseRequestStatus.ORDERED,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    itemName: 'Cleaning Supplies',
    quantity: 15,
    estimatedCost: 150,
    priority: Priority.LOW,
    status: PurchaseRequestStatus.RECEIVED,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

const statusConfig = {
  [PurchaseRequestStatus.PENDING]: {
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
  },
  [PurchaseRequestStatus.APPROVED]: {
    color: 'bg-green-100 text-green-800',
    icon: Check,
  },
  [PurchaseRequestStatus.ORDERED]: {
    color: 'bg-blue-100 text-blue-800',
    icon: Truck,
  },
  [PurchaseRequestStatus.RECEIVED]: {
    color: 'bg-emerald-100 text-emerald-800',
    icon: PackageCheck,
  },
  [PurchaseRequestStatus.CANCELLED]: {
    color: 'bg-red-100 text-red-800',
    icon: X,
  },
}

export function PurchaseRequestList({ status }: PurchaseRequestListProps) {
  const filteredRequests = status ? mockRequests.filter((r) => r.status === status) : mockRequests

  return (
    <div className="space-y-4">
      {filteredRequests.map((request) => {
        const StatusIcon = statusConfig[request.status].icon
        return (
          <Card key={request.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{request.itemName}</h3>
                    <Badge className={statusConfig[request.status].color} variant="secondary">
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {request.status}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground flex gap-6 text-sm">
                    <span>Quantity: {request.quantity}</span>
                    <span>•</span>
                    <span>Est. Cost: {formatCurrency(request.estimatedCost)}</span>
                    <span>•</span>
                    <span>Priority: {request.priority}</span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {formatRelativeTime(request.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {request.status === PurchaseRequestStatus.PENDING && (
                    <>
                      <Button size="sm" variant="default">
                        <Check className="mr-1 h-4 w-4" />
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive">
                        <X className="mr-1 h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
      {filteredRequests.length === 0 && (
        <div className="text-muted-foreground flex h-32 items-center justify-center rounded-md border-2 border-dashed">
          <p>No purchase requests found</p>
        </div>
      )}
    </div>
  )
}
