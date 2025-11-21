import { Button } from '@/components/ui/button'
import { PackagePlus, Package } from 'lucide-react'
import BulkAssignModal from './_components/BulkAssignModal'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import ConsumablesList from './_components/ConsumablesList'

export default function ConsumablesPage() {
  return (
    <SystemPageLayout>
      <SystemPageHeader
        title="Vật tư tiêu hao"
        subtitle="Quản lý vật tư tiêu hao trong kho"
        icon={<Package className="h-6 w-6" />}
        actions={
          <BulkAssignModal
            trigger={
              <Button className="border-0 bg-white text-[#0066CC] hover:bg-blue-50">
                <PackagePlus className="mr-2 h-4 w-4" /> Gán vật tư cho khách hàng
              </Button>
            }
          />
        }
      />
      <ConsumablesList />
    </SystemPageLayout>
  )
}
