import { Suspense } from 'react'
import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ServiceRequestList } from './_components/ServiceRequestList'
import { ServiceRequestFormModal } from './_components/ServiceRequestFormModal'
import { ServiceRequestStatus } from '@/constants/status'

function ServiceRequestSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}

export default async function ServiceRequestsPage() {
  let session = await getSession()

  // 🔧 DEV MODE: Use mock session
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Yêu cầu bảo trì</h1>
          <p className="text-muted-foreground">Quản lý yêu cầu bảo trì thiết bị</p>
        </div>
        <ServiceRequestFormModal customerId={session!.customerId} />
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="new">Mới</TabsTrigger>
          <TabsTrigger value="in_progress">Đang xử lý</TabsTrigger>
          <TabsTrigger value="resolved">Đã xử lý</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Tất cả yêu cầu</CardTitle>
              <CardDescription>Xem tất cả yêu cầu bảo trì</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ServiceRequestSkeleton />}>
                <ServiceRequestList customerId={session!.customerId} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>Yêu cầu mới</CardTitle>
              <CardDescription>Yêu cầu đang chờ phân công</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ServiceRequestSkeleton />}>
                <ServiceRequestList
                  customerId={session!.customerId}
                  status={ServiceRequestStatus.NEW}
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="in_progress">
          <Card>
            <CardHeader>
              <CardTitle>Đang xử lý</CardTitle>
              <CardDescription>Yêu cầu đang được xử lý</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ServiceRequestSkeleton />}>
                <ServiceRequestList
                  customerId={session!.customerId}
                  status={ServiceRequestStatus.IN_PROGRESS}
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved">
          <Card>
            <CardHeader>
              <CardTitle>Đã xử lý</CardTitle>
              <CardDescription>Yêu cầu đã hoàn thành</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ServiceRequestSkeleton />}>
                <ServiceRequestList
                  customerId={session!.customerId}
                  status={ServiceRequestStatus.RESOLVED}
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
