import WarehouseDocumentsPageClient from './_components/WarehouseDocumentsPageClient'
import { UserPageLayout } from '@/components/user/UserPageLayout'

export const metadata = {
  title: 'My Warehouse Documents',
}

export default function WarehouseDocumentsPage() {
  return (
    <UserPageLayout>
      <div className="p-4">
        <WarehouseDocumentsPageClient />
      </div>
    </UserPageLayout>
  )
}
