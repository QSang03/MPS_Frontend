'use client'

import { ExchangeRatesList } from './_components/ExchangeRatesList'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { TrendingUp, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { useState } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'

export default function ExchangeRatesPage() {
  const { t } = useLocale()
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title={t('exchange_rates.page.title')}
        subtitle={t('exchange_rates.page.subtitle')}
        icon={<TrendingUp className="h-6 w-6" />}
        actions={
          <ActionGuard pageId="exchange-rates" actionId="create">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="border-0 bg-white text-[var(--brand-500)] hover:bg-[var(--brand-50)]"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('exchange_rates.page.create_button')}
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
