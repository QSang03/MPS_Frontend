'use client'

import DevicesPageClient from './_components/DevicesPageClient'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { Monitor, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { ActionGuard } from '@/components/shared/ActionGuard'
import DeviceFormModal from './_components/deviceformmodal'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'

export default function DevicesPage() {
  const { t } = useLocale()
  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title={t('page.devices.title')}
        subtitle={t('page.devices.subtitle')}
        icon={<Monitor className="h-6 w-6" />}
        actions={
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
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
                      <Button variant="outline" className="cursor-pointer hover:bg-[var(--accent)]">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('devices.add')}
                      </Button>
                    }
                  />
                </ActionGuard>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('devices.add')}</p>
            </TooltipContent>
          </Tooltip>
        }
      />
      <DevicesPageClient />
    </SystemPageLayout>
  )
}
