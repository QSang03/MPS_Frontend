'use client'

import { CurrenciesList } from './_components/CurrenciesList'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { Coins } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

export default function CurrenciesPage() {
  const { t } = useLocale()

  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title={t('currencies.page.title')}
        subtitle={t('currencies.page.subtitle')}
        icon={<Coins className="h-6 w-6" />}
      />
      <CurrenciesList />
    </SystemPageLayout>
  )
}
