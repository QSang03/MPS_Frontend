'use client'

import { useState } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { ShoppingCart } from 'lucide-react'
import { PurchaseRequestForm } from './PurchaseRequestForm'

interface PurchaseRequestFormModalProps {
  customerId: string
}

/**
 * Purchase Request Form in a modal dialog
 */
export function PurchaseRequestFormModal({ customerId }: PurchaseRequestFormModalProps) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          {t('purchase_request.modal.create_button')}
        </Button>
      </DialogTrigger>

      <AnimatePresence>
        {open && (
          <SystemModalLayout
            title={t('purchase_request.modal.title')}
            description={t('purchase_request.modal.description')}
            icon={ShoppingCart}
            variant="create"
            maxWidth="!max-w-[60vw]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <PurchaseRequestForm
                customerId={customerId}
                mode="create"
                onSuccess={() => setOpen(false)}
              />
            </motion.div>
          </SystemModalLayout>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
