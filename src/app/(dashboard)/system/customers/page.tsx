'use client'

import { CustomerList } from './_components/CustomerList'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { Users } from 'lucide-react'
import { ActionGuard } from '@/components/shared/ActionGuard'
import CustomerFormModal from './_components/CustomerFormModal'
import { useLocale } from '@/components/providers/LocaleProvider'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

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
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <CustomerFormModal
                    mode="create"
                    trigger={
                      <Button
                        variant="outline"
                        className="cursor-pointer gap-2 hover:bg-[var(--accent)]"
                      >
                        <Plus className="h-4 w-4" />
                        {t('customer.button.add')}
                      </Button>
                    }
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('customer.button.add')}</p>
              </TooltipContent>
            </Tooltip>
          </ActionGuard>
        }
      />
      <CustomerList />
    </SystemPageLayout>
  )
}
