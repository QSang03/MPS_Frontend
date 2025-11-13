import { Suspense } from 'react'
import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { PurchaseRequestList } from './_components/PurchaseRequestList'
import { PurchaseRequestFormModal } from './_components/PurchaseRequestFormModal'
import { PurchaseRequestStatus } from '@/constants/status'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function PurchaseRequestSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}

export default async function PurchaseRequestsPage() {
  let session = await getSession()

  // 🔧 DEV MODE: Use mock session
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Yêu cầu mua hàng</h1>
          <p className="text-muted-foreground">Quản lý yêu cầu mua vật tư tiêu hao</p>
        </div>
        <PurchaseRequestFormModal customerId={session!.customerId} />
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="pending">Chờ duyệt</TabsTrigger>
          <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
          <TabsTrigger value="rejected">Từ chối</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Tất cả yêu cầu</CardTitle>
              <CardDescription>Xem tất cả yêu cầu mua hàng</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<PurchaseRequestSkeleton />}>
                <PurchaseRequestList customerId={session!.customerId} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
              <CardDescription>Requests awaiting approval</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<PurchaseRequestSkeleton />}>
                <PurchaseRequestList
                  customerId={session!.customerId}
                  status={PurchaseRequestStatus.PENDING}
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Requests</CardTitle>
              <CardDescription>Approved purchase requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<PurchaseRequestSkeleton />}>
                <PurchaseRequestList
                  customerId={session!.customerId}
                  status={PurchaseRequestStatus.APPROVED}
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Requests</CardTitle>
              <CardDescription>Declined purchase requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<PurchaseRequestSkeleton />}>
                <PurchaseRequestList
                  customerId={session!.customerId}
                  status={PurchaseRequestStatus.REJECTED}
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
