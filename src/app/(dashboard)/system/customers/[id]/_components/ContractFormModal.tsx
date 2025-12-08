'use client'

import { useState } from 'react' // Bỏ useEffect vì không còn dùng
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Sparkles, FileText, ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import ContractForm from './ContractForm'
import type { Contract } from '@/types/models/contract'
import type { ContractFormData } from '@/lib/validations/contract.schema'
import { cn } from '@/lib/utils'

interface ContractFormModalProps {
  initial?: Partial<ContractFormData> | undefined
  onCreated?: (c?: Contract | null) => void
  triggerVariant?: 'default' | 'outline' | 'ghost' | 'secondary'
  triggerClassName?: string
  triggerText?: string
  compact?: boolean
}

export function ContractFormModal({
  initial,
  onCreated,
  triggerVariant = 'default',
  triggerClassName,
  triggerText = 'Tạo hợp đồng',
  compact = false,
}: ContractFormModalProps) {
  // Normalize date string (ISO or YYYY-MM-DD) to YYYY-MM-DD or undefined
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

  // Compute duration years using the same logic that ContractForm uses when creating
  // (endDate is calculated as: start + years, then subtract 1 day). This function
  // tries 1..5 years and returns the matching number or undefined.
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
      const expected = new Date(Date.UTC(sy + years, sm, sd))
      expected.setUTCDate(expected.getUTCDate() - 1)
      // Compare date parts only (ignoring ms/time)
      if (expected.toISOString().slice(0, 10) === e.toISOString().slice(0, 10)) {
        return years
      }
    }
    return undefined
  }

  // Normalize incoming start/end and compute durationYears so form shows proper values
  const modalInitial = {
    ...initial,
    startDate: normalizeDateToYYYYMMDD(initial?.startDate) ?? initial?.startDate,
    endDate: normalizeDateToYYYYMMDD(initial?.endDate) ?? initial?.endDate,
    ...(initial?.startDate && initial?.endDate
      ? { durationYears: calcDurationYears(initial.startDate, initial.endDate) }
      : {}),
  }

  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  // ✅ FIX 1: Xóa useEffect gây lỗi set-state-in-effect
  // Logic reset sẽ được chuyển xuống onOpenChange bên dưới

  const steps = [
    {
      id: 1,
      label: 'Thông tin cơ bản',
      description: 'Mã & loại hợp đồng',
      icon: FileText,
    },
    {
      id: 2,
      label: 'Khách hàng & Thời hạn',
      description: 'Chọn khách hàng và thời gian',
      icon: ArrowRight,
    },
    {
      id: 3,
      label: 'Chi tiết',
      description: 'Mô tả và tài liệu',
      icon: CheckCircle2,
    },
  ]

  // ✅ FIX 2: Xóa hàm handleStepChange thừa (unused vars)

  const getStepStatus = (stepId: number) => {
    if (completedSteps.includes(stepId)) return 'completed'
    if (currentStep === stepId) return 'active'
    return 'inactive'
  }

  // Hàm xử lý khi đóng mở modal
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      // Reset state khi đóng modal tại đây để tránh lỗi effect
      // Dùng setTimeout nhỏ để tránh UI bị nhảy về step 1 trước khi modal đóng hẳn
      setTimeout(() => {
        setCurrentStep(1)
        setCompletedSteps([])
      }, 300)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {compact ? (
          <Button
            size="sm"
            variant={triggerVariant}
            className={cn('gap-2 shadow-sm transition-all', triggerClassName)}
          >
            <Plus className="h-4 w-4" />
            {triggerText}
          </Button>
        ) : (
          <Button
            variant={triggerVariant}
            className={cn(
              'group relative gap-2 overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg transition-all hover:scale-105 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl',
              triggerClassName
            )}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.6 }}
            />
            <div className="relative flex items-center gap-2">
              <div className="rounded-full bg-white/20 p-1">
                <Plus className="h-4 w-4" />
              </div>
              <span className="font-semibold">{triggerText}</span>
              <Sparkles className="h-4 w-4 opacity-75 transition-opacity group-hover:opacity-100" />
            </div>
          </Button>
        )}
      </DialogTrigger>

      <AnimatePresence>
        {open && (
          <SystemModalLayout
            title="Tạo hợp đồng mới"
            description="Điền đầy đủ thông tin để tạo hợp đồng mới trong hệ thống"
            icon={FileText}
            variant="create"
            maxWidth="!max-w-[80vw]"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="space-y-6"
            >
              {/* Enhanced Progress Stepper */}
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700">Tiến trình</h3>
                  <span className="text-xs font-medium text-slate-500">
                    Bước {currentStep} / {steps.length}
                  </span>
                </div>

                <div className="relative">
                  {/* Progress Bar Background */}
                  <div className="absolute top-5 right-0 left-0 h-0.5 bg-slate-200" />

                  {/* Animated Progress Bar */}
                  <motion.div
                    className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500"
                    initial={{ width: '0%' }}
                    animate={{
                      width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                    }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                  />

                  <div className="relative flex items-center justify-between">
                    {steps.map((step, index) => {
                      const status = getStepStatus(step.id)
                      const Icon = step.icon

                      return (
                        <motion.div
                          key={step.id}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex flex-col items-center"
                        >
                          {/* Step Circle */}
                          <motion.div
                            className={cn(
                              'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300',
                              status === 'completed' &&
                                'border-emerald-500 bg-emerald-500 shadow-lg shadow-emerald-200',
                              status === 'active' &&
                                'border-blue-500 bg-white shadow-lg ring-4 shadow-blue-200 ring-blue-100',
                              status === 'inactive' && 'border-slate-300 bg-white'
                            )}
                            whileHover={{ scale: 1.1 }}
                          >
                            <AnimatePresence mode="wait">
                              {status === 'completed' ? (
                                <motion.div
                                  key="check"
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: 180 }}
                                >
                                  <CheckCircle2 className="h-5 w-5 text-white" />
                                </motion.div>
                              ) : status === 'active' ? (
                                <motion.div
                                  key="icon"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                >
                                  <Icon className="h-5 w-5 text-[var(--brand-600)]" />
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="circle"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                >
                                  <Circle className="h-5 w-5 text-slate-400" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>

                          {/* Step Label */}
                          <motion.div
                            className="mt-3 text-center"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 + 0.2 }}
                          >
                            <p
                              className={cn(
                                'text-xs font-semibold transition-colors',
                                status === 'completed' && 'text-emerald-700',
                                status === 'active' && 'text-blue-700',
                                status === 'inactive' && 'text-slate-500'
                              )}
                            >
                              {step.label}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-400">{step.description}</p>
                          </motion.div>

                          {/* Pulse Animation for Active Step */}
                          {status === 'active' && (
                            <motion.div
                              className="absolute h-10 w-10 rounded-full bg-blue-400"
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 0, 0.3],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                              }}
                            />
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Current Step Info Card */}
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="rounded-lg border border-[var(--brand-200)] bg-gradient-to-br from-[var(--brand-50)] to-[var(--brand-50)] p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900">{steps[currentStep - 1]?.label}</h4>
                    <p className="mt-1 text-sm text-blue-700">
                      {steps[currentStep - 1]?.description}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Form Container with Animation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <ContractForm
                  initial={modalInitial}
                  onSuccess={(created) => {
                    // Animate completion
                    setCompletedSteps([1, 2, 3])
                    setCurrentStep(3)

                    setTimeout(() => {
                      setOpen(false)
                      if (created) onCreated?.(created)
                    }, 1000)
                  }}
                />
              </motion.div>

              {/* Helper Text */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-2 text-xs text-slate-500"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span>Tất cả các trường có dấu * là bắt buộc</span>
              </motion.div>
            </motion.div>
          </SystemModalLayout>
        )}
      </AnimatePresence>
    </Dialog>
  )
}

export default ContractFormModal
