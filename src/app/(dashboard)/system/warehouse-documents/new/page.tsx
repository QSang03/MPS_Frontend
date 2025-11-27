import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getSession } from '@/lib/auth/session'
import { DEV_BYPASS_AUTH, getDevSession } from '@/lib/auth/dev-session'

export const dynamic = 'force-dynamic'

export default async function NewWarehouseDocumentPage() {
  let session = await getSession()
  if (!session && DEV_BYPASS_AUTH) session = getDevSession('sys-admin')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tạo chứng từ kho</h1>
        <p className="text-muted-foreground">Tạo chứng từ nhập/xuất/trả mới</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Form tạo chứng từ</CardTitle>
          <CardDescription>Form tạo chứng từ sẽ được xây dựng theo DTO chính thức</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">
            Tính năng tạo sẽ được thực hiện trong bước tiếp theo.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
