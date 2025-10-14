import { Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CustomerList } from './_components/CustomerList'
import { Skeleton } from '@/components/ui/skeleton'

function CustomerListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Khách hàng</h1>
          <p className="text-muted-foreground">Quản lý tất cả khách hàng trong hệ thống</p>
        </div>
        <Button asChild>
          <Link href="/system-admin/customers/new">
            <Plus className="mr-2 h-4 w-4" />
            Thêm khách hàng
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách khách hàng</CardTitle>
          <CardDescription>Xem và quản lý tất cả tài khoản khách hàng</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<CustomerListSkeleton />}>
            <CustomerList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
