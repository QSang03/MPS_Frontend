'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import MonthPicker from '@/components/ui/month-picker'
import { cn } from '@/lib/utils/cn'
import { useLocale } from '@/components/providers/LocaleProvider'

interface DateRangeSelectorProps {
  defaultMonth?: string // Format: YYYY-MM
  onChange?: (month: string) => void
}

export function DateRangeSelector({ defaultMonth, onChange }: DateRangeSelectorProps) {
  // Initialize with default month or current month
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (defaultMonth) return defaultMonth
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Parse selected month
  const parts = selectedMonth.split('-').map(Number)
  const year = parts[0] ?? new Date().getFullYear()
  const month = parts[1] ?? new Date().getMonth() + 1

  const { locale, t } = useLocale()

  // Quick select options (labels will use translations)
  const quickSelects = [
    { label: t('dashboard.date_range.this_month'), value: 0 },
    { label: t('dashboard.date_range.last_month'), value: -1 },
    { label: t('dashboard.date_range.last_3_months'), value: -3 },
    { label: t('dashboard.date_range.last_6_months'), value: -6 },
  ]

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth)
    onChange?.(newMonth)
  }

  const handlePrevMonth = () => {
    const date = new Date(year, month - 1)
    date.setMonth(date.getMonth() - 1)
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    handleMonthChange(newMonth)
  }

  const handleNextMonth = () => {
    const date = new Date(year, month - 1)
    date.setMonth(date.getMonth() + 1)
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    handleMonthChange(newMonth)
  }

  const handleQuickSelect = (monthsOffset: number) => {
    const now = new Date()
    now.setMonth(now.getMonth() + monthsOffset)
    const newMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    handleMonthChange(newMonth)
  }

  // Format display month according to current locale
  const localeCode = locale === 'vi' ? 'vi-VN' : 'en-US'
  const displayMonth = new Date(year, month - 1).toLocaleDateString(localeCode, {
    month: 'long',
    year: 'numeric',
  })

  // Check if next month button should be disabled (can't select future months)
  const isNextMonthDisabled = () => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return selectedMonth >= currentMonth
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Month Navigator */}
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-500" />
            {/* small MonthPicker trigger - keeps original layout but provides a place to open calendar */}
            <div className="hidden sm:block">
              <MonthPicker
                value={selectedMonth}
                onChange={(v) => handleMonthChange(v)}
                onApply={(v) => handleMonthChange(v)}
                className="w-44"
                placeholder=""
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevMonth}
                className="h-9 w-9 rounded-full border-slate-200 text-slate-700 hover:bg-slate-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="min-w-[180px] text-center">
                <p className="text-lg font-semibold text-gray-900">{displayMonth}</p>
                <p className="text-xs text-gray-500">{selectedMonth}</p>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
                disabled={isNextMonthDisabled()}
                className="h-9 w-9 rounded-full border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex flex-wrap gap-2">
            {quickSelects.map((option) => {
              const now = new Date()
              now.setMonth(now.getMonth() + option.value)
              const optionMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
              const isActive = selectedMonth === optionMonth

              return (
                <Button
                  key={option.label}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleQuickSelect(option.value)}
                  className={cn(
                    'h-9 rounded-full border border-transparent px-4 text-sm font-semibold transition-all',
                    isActive
                      ? 'bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] shadow-sm hover:bg-[var(--btn-primary-hover)]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-[var(--brand-500)] hover:text-[var(--brand-500)]'
                  )}
                >
                  {option.label}
                </Button>
              )
            })}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
