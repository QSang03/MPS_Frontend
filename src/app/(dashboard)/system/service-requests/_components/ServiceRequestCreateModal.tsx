'use client'

import { useState } from 'react'
import { Plus, Wrench } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { ServiceRequestForm } from './ServiceRequestForm'
import { CustomerSelect } from '@/components/shared/CustomerSelect'
import { ActionGuard } from '@/components/shared/ActionGuard'

export function ServiceRequestCreateModal() {
  const [open, setOpen] = useState(false)
  const [customerId, setCustomerId] = useState<string>('')
  const { t } = useLocale()

  return (
    <ActionGuard pageId="customer-requests" actionId="create">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t('user_service_request.create_new')}
          </Button>
        </DialogTrigger>
        <SystemModalLayout
          title={t('user_service_request.modal.title')}
          description={t('user_service_request.modal.description')}
          icon={Wrench}
          variant="create"
          maxWidth="!max-w-[80vw]"
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                {t('user_service_request.customer.title')}
              </label>
              <div className="mt-2">
                <ActionGuard pageId="customer-requests" actionId="filter-by-customer">
                  <CustomerSelect
                    value={customerId}
                    onChange={(id) => setCustomerId(id)}
                    placeholder={t('user_service_request.select_customer_placeholder')}
                  />
                </ActionGuard>
              </div>
            </div>

            {customerId ? (
              <ServiceRequestForm customerId={customerId} onSuccess={() => setOpen(false)} />
            ) : (
              <div className="text-sm text-slate-500">
                {t('user_service_request.select_customer_prompt')}
              </div>
            )}
          </div>
        </SystemModalLayout>
      </Dialog>
    </ActionGuard>
  )
}
