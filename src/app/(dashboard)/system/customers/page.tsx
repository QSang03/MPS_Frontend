import { CustomerList } from './_components/CustomerList'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { Users } from 'lucide-react'
import { ActionGuard } from '@/components/shared/ActionGuard'
import CustomerFormModal from './_components/CustomerFormModal'

export default function CustomersPage() {
  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title="Quản lý Khách hàng"
        subtitle="Tạo, chỉnh sửa và quản lý các khách hàng"
        icon={<Users className="h-6 w-6" />}
        actions={
          <ActionGuard pageId="customers" actionId="create">
            <CustomerFormModal mode="create" />
          </ActionGuard>
        }
      />
      <CustomerList />
    </SystemPageLayout>
  )
}
