import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import WarehouseDocumentForm from '../_components/WarehouseDocumentForm'
import { UserPageLayout } from '@/components/user/UserPageLayout'

export const dynamic = 'force-dynamic'

export default function NewWarehouseDocumentPage() {
  return (
    <UserPageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tạo chứng từ kho</h1>
          <p className="text-muted-foreground">Tạo chứng từ nhập/xuất/trả mới (user)</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Form tạo chứng từ</CardTitle>
            <CardDescription>
              Form tạo chứng từ sẽ được xây dựng theo DTO chính thức
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WarehouseDocumentForm />
          </CardContent>
        </Card>
      </div>
    </UserPageLayout>
  )
}
