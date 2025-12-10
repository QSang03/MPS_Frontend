'use client'

import { CustomerList } from './_components/CustomerList'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { Users } from 'lucide-react'
import { ActionGuard } from '@/components/shared/ActionGuard'
import CustomerFormModal from './_components/CustomerFormModal'
import { useLocale } from '@/components/providers/LocaleProvider'

export default function CustomersPage() {
  const { t } = useLocale()

  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title={t('page.customers.title')}
        subtitle={t('page.customers.subtitle')}
        icon={<Users className="h-6 w-6" />}
        actions={
          <ActionGuard pageId="customers" actionId="create">
            <CustomerFormModal mode="create" />
          </ActionGuard>
        }
      />
      <CustomerList />
    </SystemPageLayout>
  )
}
