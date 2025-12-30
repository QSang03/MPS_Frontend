'use client'

import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import LeadList from './_components/LeadList'
import { Users } from 'lucide-react'

export default function LeadsPage() {
  const { t } = useLocale()

  return (
    <SystemPageLayout>
      <SystemPageHeader
        title={t('nav.leads') || 'Leads'}
        subtitle={t('nav.leads_sub') || 'Manage inbound consultation leads'}
        icon={<Users className="h-6 w-6" />}
      />
      <LeadList />
    </SystemPageLayout>
  )
}
