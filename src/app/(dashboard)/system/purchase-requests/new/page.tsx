import { Suspense } from 'react'
import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PurchaseRequestForm } from '../_components/PurchaseRequestForm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function PurchaseRequestFormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export default async function NewPurchaseRequestPage() {
  let session = await getSession()

  // 🔧 DEV MODE: Use mock session
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tạo yêu cầu mua hàng</h1>
        <p className="text-muted-foreground">Tạo yêu cầu mua vật tư tiêu hao mới</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin yêu cầu mua hàng</CardTitle>
          <CardDescription>Điền thông tin chi tiết về vật tư cần mua</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<PurchaseRequestFormSkeleton />}>
            <PurchaseRequestForm customerId={session!.customerId} mode="create" />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
