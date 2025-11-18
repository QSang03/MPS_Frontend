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
  className?: string
  placeholder?: string
}

// Small, dependency-free month picker using Radix popover + select components.
// Years range: currentYear-5 .. currentYear+1 (reasonable default). Adjust if needed.
export function MonthPicker({ value, onChange, className, placeholder }: Props) {
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

  React.useEffect(() => {
    const p = parse(value)
    setSelYear(p.year)
    setSelMonth(p.month)
  }, [value, parse])

  const formatted = value ? value : ''

  const apply = () => {
    const m = String(selMonth).padStart(2, '0')
    const v = `${selYear}-${m}`
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
        <Input readOnly placeholder={placeholder} value={formatted} className={cn(className)} />
      </PopoverTrigger>

      <PopoverContent className="w-auto">
        <div className="flex items-center gap-2">
          <div className="min-w-[9rem]">
            <Select value={String(selMonth)} onValueChange={(v) => setSelMonth(Number(v))}>
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
            <Select value={String(selYear)} onValueChange={(v) => setSelYear(Number(v))}>
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
