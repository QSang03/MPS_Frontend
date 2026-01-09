'use client'

import { CollectorList } from './_components/CollectorList'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { Server } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

export default function CollectorsPage() {
  const { t } = useLocale()

  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title={t('collectors.page_title')}
        subtitle={t('collectors.page_subtitle')}
        icon={<Server className="h-6 w-6" />}
      />
      <CollectorList />
    </SystemPageLayout>
  )
}
