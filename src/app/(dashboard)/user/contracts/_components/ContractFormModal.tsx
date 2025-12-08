'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Sparkles, FileText, ArrowRight } from 'lucide-react'
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
  trigger?: React.ReactNode
}

export function ContractFormModal({ initial, onCreated, trigger }: ContractFormModalProps) {
  const [open, setOpen] = useState(false)

  const normalizeDateToYYYYMMDD = (date?: string | null): string | undefined => {
    if (!date) return undefined
    try {
      const d = new Date(date)
      if (Number.isNaN(d.getTime())) return undefined
      return d.toISOString().slice(0, 10)
    } catch {
      return undefined
    }
  }

  const calcDurationYears = (start?: string, end?: string): number | undefined => {
    const sNorm = normalizeDateToYYYYMMDD(start)
    const eNorm = normalizeDateToYYYYMMDD(end)
    if (!sNorm || !eNorm) return undefined
    const s = new Date(sNorm)
    const e = new Date(eNorm)
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return undefined
    const sy = s.getUTCFullYear()
    const sm = s.getUTCMonth()
    const sd = s.getUTCDate()
    for (let years = 1; years <= 5; years++) {
      const expectedExclusive = new Date(Date.UTC(sy + years, sm, sd))
      expectedExclusive.setUTCDate(expectedExclusive.getUTCDate() - 1)
      const expectedInclusive = new Date(Date.UTC(sy + years, sm, sd))
      const eIso = e.toISOString().slice(0, 10)
      if (
        expectedExclusive.toISOString().slice(0, 10) === eIso ||
        expectedInclusive.toISOString().slice(0, 10) === eIso
      ) {
        return years
      }
    }
    return undefined
  }
  const modalInitial = {
    ...initial,
    startDate: normalizeDateToYYYYMMDD(initial?.startDate) ?? initial?.startDate,
    endDate: normalizeDateToYYYYMMDD(initial?.endDate) ?? initial?.endDate,
    ...(initial?.startDate && initial?.endDate
      ? { durationYears: calcDurationYears(initial.startDate, initial.endDate) }
      : {}),
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] shadow-lg transition-all hover:bg-[var(--btn-primary-hover)] hover:shadow-xl">
            <Plus className="h-4 w-4" />
            Tạo hợp đồng
          </Button>
        )}
      </DialogTrigger>

      <AnimatePresence>
        {open && (
          <DialogContent className="max-h-[90vh] !max-w-[75vw] rounded-2xl border-0 p-0 shadow-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex h-full flex-col"
            >
              {/* Header with Gradient Background */}
              <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-[var(--brand-600)] via-[var(--brand-500)] to-[var(--brand-400)] p-0">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 right-0 h-40 w-40 translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
                  <div className="absolute bottom-0 left-0 h-32 w-32 -translate-x-1/2 translate-y-1/2 rounded-full bg-white"></div>
                </div>
                <div className="relative z-10 px-6 py-6 text-white">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.2 }}
                    className="flex items-center gap-4"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      className="rounded-xl border border-white/30 bg-white/20 p-2.5 backdrop-blur-lg"
                    >
                      <Sparkles className="h-6 w-6 text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-white">
                        ✨ Tạo hợp đồng mới
                      </DialogTitle>
                      <DialogDescription className="mt-1 flex items-center gap-2 text-white/90">
                        <FileText className="h-4 w-4" />
                        Nhập đầy đủ thông tin hợp đồng bên dưới
                      </DialogDescription>
                    </div>
                  </motion.div>
                </div>
              </DialogHeader>

              {/* Content Area */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="flex-1 overflow-y-auto bg-gradient-to-b from-white via-[var(--brand-50)]/30 to-white"
              >
                <div className="p-6">
                  {/* Progress indicator */}
                  <div className="mb-6 flex items-center gap-3 text-xs font-semibold text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-[var(--brand-600)]"></div>
                      Thông tin cơ bản
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                      Khách hàng & Thời hạn
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                      Chi tiết
                    </div>
                  </div>

                  <ContractForm
                    initial={modalInitial}
                    onSuccess={(created) => {
                      setOpen(false)
                      if (created) onCreated?.(created)
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  )
}

export default ContractFormModal
