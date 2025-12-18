'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Wrench } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ServiceRequestForm } from './ServiceRequestForm'

interface ServiceRequestFormModalProps {
  customerId: string
}

/**
 * Service Request Form in a modal dialog
 */
export function ServiceRequestFormModal({ customerId }: ServiceRequestFormModalProps) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          {t('requests.service.create_button')}
        </Button>
      </DialogTrigger>

      <AnimatePresence>
        {open && (
          <SystemModalLayout
            title={t('requests.service.modal.title')}
            description={t('requests.service.modal.description')}
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
