import WarehouseDocumentsPageClient from './_components/WarehouseDocumentsPageClient'
import { UserPageLayout } from '@/components/user/UserPageLayout'

export const metadata = {
  title: 'Chứng từ kho của tôi',
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
