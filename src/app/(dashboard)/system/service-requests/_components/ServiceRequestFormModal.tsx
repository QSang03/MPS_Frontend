'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Wrench } from 'lucide-react'
import { ServiceRequestForm } from './ServiceRequestForm'

interface ServiceRequestFormModalProps {
  customerId: string
}

/**
 * Service Request Form in a modal dialog
 */
export function ServiceRequestFormModal({ customerId }: ServiceRequestFormModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Tạo yêu cầu
        </Button>
      </DialogTrigger>

      <AnimatePresence>
        {open && (
          <SystemModalLayout
            title="Tạo yêu cầu bảo trì mới"
            description="Điền thông tin chi tiết cho yêu cầu bảo trì mới"
            icon={Wrench}
            variant="create"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <ServiceRequestForm customerId={customerId} onSuccess={() => setOpen(false)} />
            </motion.div>
          </SystemModalLayout>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
