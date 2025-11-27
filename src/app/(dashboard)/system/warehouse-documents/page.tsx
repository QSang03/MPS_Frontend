import { WarehouseDocumentList } from './_components/WarehouseDocumentList'
import { getSession } from '@/lib/auth/session'
import { DEV_BYPASS_AUTH, getDevSession } from '@/lib/auth/dev-session'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function WarehouseDocumentsPage() {
  let session = await getSession()
  if (!session && DEV_BYPASS_AUTH) session = getDevSession('sys-admin')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chứng từ kho</h1>
          <p className="text-muted-foreground">Danh sách các chứng từ nhập/xuất/trả</p>
        </div>
        <div className="flex gap-2">
          <Link href="/system/warehouse-documents/new">
            <Button variant="default">Tạo chứng từ mới</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách chứng từ</CardTitle>
          <CardDescription>Quản lý chứng từ xuất/nhập trả trong kho</CardDescription>
        </CardHeader>
        <CardContent>
          <WarehouseDocumentList />
        </CardContent>
      </Card>
    </div>
  )
}
