'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import ContractForm from './ContractForm'
import type { Contract } from '@/types/models/contract'
import type { ContractFormData } from '@/lib/validations/contract.schema'

interface ContractFormModalProps {
  initial?: Partial<ContractFormData> | undefined
  onCreated?: (c?: Contract | null) => void
}

export function ContractFormModal({ initial, onCreated }: ContractFormModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Tạo hợp đồng
        </Button>
      </DialogTrigger>

      <AnimatePresence>
        {open && (
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <DialogTitle className="font-display text-2xl font-bold">
                  Tạo hợp đồng mới
                </DialogTitle>
                <DialogDescription>Nhập thông tin hợp đồng</DialogDescription>
              </DialogHeader>

              <div className="mt-6">
                {}
                <ContractForm
                  initial={initial}
                  onSuccess={(created) => {
                    // close modal and notify parent with created contract
                    setOpen(false)
                    if (created) onCreated?.(created)
                  }}
                />
              </div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  )
}

export default ContractFormModal
