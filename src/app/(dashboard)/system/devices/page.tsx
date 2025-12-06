'use client'

import DevicesPageClient from './_components/DevicesPageClient'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { Monitor, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActionGuard } from '@/components/shared/ActionGuard'
import DeviceFormModal from './_components/deviceformmodal'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'

export default function DevicesPage() {
  const { t } = useLocale()
  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title="Danh sách thiết bị"
        subtitle="Quản lý tất cả thiết bị trong hệ thống"
        icon={<Monitor className="h-6 w-6" />}
        actions={
          <ActionGuard pageId="devices" actionId="create">
            <DeviceFormModal
              mode="create"
              onSaved={() => {
                toast.success(t('device.create_success'))
                if (typeof window !== 'undefined') {
                  window.location.reload()
                }
              }}
              trigger={
                <Button className="border-0 bg-white text-[#0066CC] hover:bg-blue-50">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('devices.add')}
                </Button>
              }
            />
          </ActionGuard>
        }
      />
      <DevicesPageClient />
    </SystemPageLayout>
  )
}
