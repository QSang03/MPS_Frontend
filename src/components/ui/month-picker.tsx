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

  const formatted = value ? value : ''

  // Local display value to update the input immediately when user applies
  const [displayValue, setDisplayValue] = React.useState<string>(formatted)

  React.useEffect(() => {
    setDisplayValue(formatted)
  }, [formatted])
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Input readOnly placeholder={placeholder} value={displayValue} className={cn(className)} />
      </PopoverTrigger>

      <PopoverContent className="w-auto">
        <div className="flex items-center gap-2">
          <div className="min-w-[9rem]">
            <Select
              value={String(selMonth)}
              onValueChange={(v) => {
                const n = Number(v)
                selMonthRef.current = n
                setSelMonth(n)
              }}
            >
              <SelectTrigger className="w-full">
                {/* Let SelectValue render the current value; show placeholder when empty */}
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {String(m).padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[9rem]">
            <Select
              value={String(selYear)}
              onValueChange={(v) => {
                const n = Number(v)
                selYearRef.current = n
                setSelYear(n)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="YYYY" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={cancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={apply}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default MonthPicker
