'use client'

import * as React from 'react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLocale } from '@/components/providers/LocaleProvider'

type Props = {
  value?: string // expected format: YYYY-MM
  onChange?: (v: string) => void
  onApply?: (v: string) => void
  className?: string
  placeholder?: string
}

// Small, dependency-free month picker using Radix popover + select components.
// Years range: currentYear-5 .. currentYear+1 (reasonable default). Adjust if needed.
export function MonthPicker({ value, onChange, onApply, className, placeholder }: Props) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const minYear = currentYear - 5
  const maxYear = currentYear + 1

  const years = React.useMemo(() => {
    const arr: number[] = []
    for (let y = minYear; y <= maxYear; y++) arr.push(y)
    return arr
  }, [minYear, maxYear])

  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]

  const nowMonth = now.getMonth() + 1

  const parse = React.useCallback(
    (v?: string) => {
      if (!v) return { year: currentYear, month: nowMonth }
      const [y, m] = v.split('-')
      const year = Number(y) || currentYear
      const month = Number(m) || nowMonth
      return { year, month }
    },
    [currentYear, nowMonth]
  )

  const initial = parse(value)

  const [open, setOpen] = React.useState(false)
  const [selYear, setSelYear] = React.useState<number>(initial.year)
  const [selMonth, setSelMonth] = React.useState<number>(initial.month)
  // Refs to store latest selected values synchronously to avoid stale state
  // when user selects an option and immediately clicks Apply (event ordering).
  const selYearRef = React.useRef<number>(initial.year)
  const selMonthRef = React.useRef<number>(initial.month)

  React.useEffect(() => {
    const p = parse(value)
    setSelYear(p.year)
    setSelMonth(p.month)
    selYearRef.current = p.year
    selMonthRef.current = p.month
  }, [value, parse])

  // Always normalize incoming `value` prop to `YYYY-MM` so display is consistent
  const normalizedFromValue = React.useMemo(() => {
    const p = parse(value)
    return `${p.year}-${String(p.month).padStart(2, '0')}`
  }, [value, parse])

  // Local display value to update the input immediately when user applies
  const [displayValue, setDisplayValue] = React.useState<string>(normalizedFromValue)

  React.useEffect(() => {
    setDisplayValue(normalizedFromValue)
  }, [normalizedFromValue])
  const apply = () => {
    // Read from refs to ensure we get the most recent selection even if
    // the state update for selMonth/selYear hasn't been flushed yet.
    const year = selYearRef.current
    const monthNum = selMonthRef.current
    const m = String(monthNum).padStart(2, '0')
    const v = `${year}-${m}`
    // Update local display immediately so the input doesn't flick back
    setDisplayValue(v)
    // Call onApply first so callers that use the passed value don't rely on
    // updated parent state (which may be async). Keep onChange for controlled
    // usage but call after onApply.
    try {
      // small debug log to help trace issues in runtime
      console.debug('[MonthPicker] apply', v)
    } catch {
      // ignore
    }
    onApply?.(v)
    onChange?.(v)
    setOpen(false)
  }

  const cancel = () => {
    const p = parse(value)
    setSelYear(p.year)
    setSelMonth(p.month)
    setOpen(false)
  }

  const { t } = useLocale()

  // Handle direct input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setDisplayValue(inputValue)

    // Validate format YYYY-MM
    const regex = /^\d{4}-\d{2}$/
    if (regex.test(inputValue)) {
      const [y, m] = inputValue.split('-')
      const year = Number(y)
      const month = Number(m)

      // Validate year and month ranges
      if (year >= minYear && year <= maxYear && month >= 1 && month <= 12) {
        const normalized = `${year}-${String(month).padStart(2, '0')}`
        onChange?.(normalized)
        onApply?.(normalized)
        setSelYear(year)
        setSelMonth(month)
        selYearRef.current = year
        selMonthRef.current = month
      }
    }
  }

  const handleInputBlur = () => {
    // Validate and normalize on blur
    const regex = /^\d{4}-\d{2}$/
    if (regex.test(displayValue)) {
      const [y, m] = displayValue.split('-')
      const year = Number(y)
      const month = Number(m)

      if (year >= minYear && year <= maxYear && month >= 1 && month <= 12) {
        const normalized = `${year}-${String(month).padStart(2, '0')}`
        setDisplayValue(normalized)
        onChange?.(normalized)
        onApply?.(normalized)
      } else {
        // Reset to current value if invalid
        setDisplayValue(normalizedFromValue)
      }
    } else {
      // Reset to current value if format invalid
      setDisplayValue(normalizedFromValue)
    }
  }

  // Auto-apply when selecting month from grid
  const handleMonthClick = (m: number) => {
    selMonthRef.current = m
    setSelMonth(m)
    const year = selYearRef.current
    const normalized = `${year}-${String(m).padStart(2, '0')}`
    setDisplayValue(normalized)
    onChange?.(normalized)
    onApply?.(normalized)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          placeholder={placeholder || 'YYYY-MM'}
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => setOpen(true)}
          className={cn('w-32 cursor-pointer', className)}
        />
      </PopoverTrigger>

      <PopoverContent className="w-64 p-2">
        <div className="mb-2">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                const n = selYearRef.current - 1
                if (n >= minYear) {
                  selYearRef.current = n
                  setSelYear(n)
                }
              }}
              disabled={selYear <= minYear}
              className="h-6 w-6 p-0"
            >
              ‹
            </Button>
            <div className="min-w-[50px] text-center text-sm font-semibold">{selYear}</div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                const n = selYearRef.current + 1
                if (n <= maxYear) {
                  selYearRef.current = n
                  setSelYear(n)
                }
              }}
              disabled={selYear >= maxYear}
              className="h-6 w-6 p-0"
            >
              ›
            </Button>
          </div>

          <div className="grid grid-cols-6 gap-1">
            {months.map((m, idx) => {
              const selected = selMonth === m
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMonthClick(m)}
                  className={cn(
                    'rounded px-1.5 py-1 text-[10px] font-medium transition-colors',
                    selected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {monthNames[idx]}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-1.5 border-t pt-2">
          <div className="flex-1">
            <Select
              value={String(selMonth)}
              onValueChange={(v) => {
                const n = Number(v)
                selMonthRef.current = n
                setSelMonth(n)
              }}
            >
              <SelectTrigger className="h-7 w-full text-xs">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m} value={String(m)} className="text-xs">
                    {String(m).padStart(2, '0')} - {monthNames[m - 1]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Select
              value={String(selYear)}
              onValueChange={(v) => {
                const n = Number(v)
                selYearRef.current = n
                setSelYear(n)
              }}
            >
              <SelectTrigger className="h-7 w-full text-xs">
                <SelectValue placeholder="YYYY" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)} className="text-xs">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-1.5">
          <Button variant="secondary" size="sm" onClick={cancel} className="h-7 px-2 text-xs">
            {t('cancel')}
          </Button>
          <Button size="sm" onClick={apply} className="h-7 px-2 text-xs">
            {t('button.apply')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default MonthPicker
