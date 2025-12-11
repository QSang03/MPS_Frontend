'use client'

import React from 'react'
import DeviceModelList from './_components/DeviceModelList'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { Package, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { DeviceModelFormModal } from './_components/DeviceModelFormModal'

export default function Page() {
  const { t } = useLocale()
  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title={t('page.device_models.title')}
        subtitle={t('page.device_models.subtitle')}
        icon={<Package className="h-6 w-6" />}
        actions={
          <ActionGuard pageId="device-models" actionId="create">
            <DeviceModelFormModal
              mode="create"
              onSaved={() => {
                // Refresh will be handled by DeviceModelList
                window.location.reload()
              }}
              trigger={
                <Button className="rounded-md border-0 bg-[var(--brand-100)] px-3 py-1.5 text-[var(--brand-700)] hover:bg-[var(--brand-200)]">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('device_model.button.create')}
                </Button>
              }
            />
          </ActionGuard>
        }
      />
      <DeviceModelList />
    </SystemPageLayout>
  )
}
