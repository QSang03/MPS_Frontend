'use client'

import { useState } from 'react'
import { Plus, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { ServiceRequestForm } from './ServiceRequestForm'
import { CustomerSelect } from '@/components/shared/CustomerSelect'
import { ActionGuard } from '@/components/shared/ActionGuard'

export function ServiceRequestCreateModal() {
  const [open, setOpen] = useState(false)
  const [customerId, setCustomerId] = useState<string>('')

  return (
    <ActionGuard pageId="customer-requests" actionId="create">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo yêu cầu
          </Button>
        </DialogTrigger>
        <SystemModalLayout
          title="Tạo yêu cầu bảo trì mới"
          description="Tạo yêu cầu thay mặt cho khách hàng"
          icon={Wrench}
          variant="create"
          maxWidth="!max-w-[80vw]"
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Khách hàng</label>
              <div className="mt-2">
                <CustomerSelect
                  value={customerId}
                  onChange={(id) => setCustomerId(id)}
                  placeholder="Chọn khách hàng để tạo yêu cầu"
                />
              </div>
            </div>

            {customerId ? (
              <ServiceRequestForm customerId={customerId} onSuccess={() => setOpen(false)} />
            ) : (
              <div className="text-sm text-slate-500">Vui lòng chọn khách hàng để tiếp tục.</div>
            )}
          </div>
        </SystemModalLayout>
      </Dialog>
    </ActionGuard>
  )
}
