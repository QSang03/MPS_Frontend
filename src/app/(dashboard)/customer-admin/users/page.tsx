import { Suspense } from 'react'
import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { UserList } from './_components/UserList'
import { UserFormModal } from './_components/UserFormModal'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function UserListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}

export default async function UsersPage() {
  let session = await getSession()

  // 🔧 DEV MODE: Use mock session
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Người dùng</h1>
          <p className="text-muted-foreground">Quản lý tài khoản người dùng trong tổ chức</p>
        </div>
        <UserFormModal customerId={session!.customerId} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng</CardTitle>
          <CardDescription>Xem và quản lý tất cả tài khoản</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<UserListSkeleton />}>
            <UserList customerId={session!.customerId} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
