import { Card, CardContent } from '@/components/ui/card'
import WarehouseDocumentForm from '../_components/WarehouseDocumentForm'
import UserNewWarehouseDocumentHeaderClient from '../UserNewWarehouseDocumentHeaderClient'
import UserNewWarehouseDocumentFormHeaderClient from '../UserNewWarehouseDocumentFormHeaderClient'
import { UserPageLayout } from '@/components/user/UserPageLayout'

export const dynamic = 'force-dynamic'

export default function NewWarehouseDocumentPage() {
  return (
    <UserPageLayout>
      <div className="space-y-6">
        <UserNewWarehouseDocumentHeaderClient />
        <Card>
          <UserNewWarehouseDocumentFormHeaderClient />
          <CardContent>
            <WarehouseDocumentForm />
          </CardContent>
        </Card>
      </div>
    </UserPageLayout>
  )
}
