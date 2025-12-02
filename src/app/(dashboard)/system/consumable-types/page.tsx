'use client'

import { ConsumableTypeList } from './_components/ConsumableTypeList'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { Package, Plus, Upload, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActionGuard } from '@/components/shared/ActionGuard'
import ImportExcelModal from './_components/ImportExcelModal'
import BulkAssignModal from '../consumables/_components/BulkAssignModal'
import ConsumableTypeFormModal from './_components/ConsumableTypeFormModal'

export default function ConsumableTypesPage() {
  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title="Loại Vật Tư Tiêu Hao"
        subtitle="Quản lý các loại vật tư tiêu hao cho thiết bị"
        icon={<Package className="h-8 w-8" />}
        actions={
          <>
            <ImportExcelModal
              trigger={
                <Button className="border-0 bg-white text-[#0066CC] hover:bg-blue-50">
                  <Upload className="mr-2 h-4 w-4" />
                  Import Excel
                </Button>
              }
            />
            <BulkAssignModal
              trigger={
                <Button className="border-0 bg-white text-[#0066CC] hover:bg-blue-50">
                  <Link2 className="mr-2 h-4 w-4" />
                  Gán vật tư cho khách hàng
                </Button>
              }
            />
            <ActionGuard pageId="consumable-types" actionId="create">
              <ConsumableTypeFormModal
                mode="create"
                onSaved={() => {
                  if (typeof window !== 'undefined') {
                    window.location.reload()
                  }
                }}
                trigger={
                  <Button className="border-0 bg-white text-[#0066CC] hover:bg-blue-50">
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm loại vật tư
                  </Button>
                }
              />
            </ActionGuard>
          </>
        }
      />
      <ConsumableTypeList />
    </SystemPageLayout>
  )
}
