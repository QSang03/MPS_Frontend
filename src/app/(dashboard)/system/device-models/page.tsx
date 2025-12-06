'use client'

import React from 'react'
import DeviceModelList from './_components/DeviceModelList'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { Package, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { DeviceModelFormModal } from './_components/DeviceModelFormModal'

export default function Page() {
  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title="Quản lý Model Thiết bị"
        subtitle="Quản lý các model thiết bị và tương thích vật tư"
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
                <Button className="border-0 bg-white text-[var(--brand-500)] hover:bg-[var(--brand-50)]">
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm model
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
