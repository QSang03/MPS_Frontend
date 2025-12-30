'use client'

import { LeadListClient } from './_components/LeadList'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ActionGuard } from '@/components/shared/ActionGuard'

export default function LeadsPage() {
  const { t } = useLocale()

  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title={t('nav.leads') || 'Leads'}
        subtitle={t('leads.subtitle') || 'Manage leads and inquiries'}
        actions={
          <ActionGuard pageId="leads" actionId="read">
            <Button className="rounded-lg border-0 bg-white text-[var(--brand-500)] hover:bg-[var(--brand-50)]">
              <Plus className="mr-2 h-4 w-4" />
              {t('nav.leads')}
            </Button>
          </ActionGuard>
        }
      />

      <div className="p-6">
        <LeadListClient />
      </div>
    </SystemPageLayout>
  )
}
