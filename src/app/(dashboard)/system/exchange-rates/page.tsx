'use client'

import { ExchangeRatesList } from './_components/ExchangeRatesList'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { TrendingUp, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { useState } from 'react'

export default function ExchangeRatesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title="Quản lý Tỷ giá"
        subtitle="Tạo và quản lý tỷ giá hối đoái giữa các loại tiền tệ"
        icon={<TrendingUp className="h-6 w-6" />}
        actions={
          <ActionGuard pageId="exchange-rates" actionId="create">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="border-0 bg-white text-[#0066CC] hover:bg-blue-50"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tạo tỷ giá
            </Button>
          </ActionGuard>
        }
      />
      <ExchangeRatesList
        onCreateTrigger={showCreateModal}
        onCreateTriggerReset={() => setShowCreateModal(false)}
      />
    </SystemPageLayout>
  )
}
