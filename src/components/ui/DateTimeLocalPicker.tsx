'use client'

import React, { useEffect, useId, useState } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react'
import { format } from 'date-fns'
import { enUS, vi } from 'date-fns/locale'
import type { CalendarMonth } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLocale } from '@/components/providers/LocaleProvider'
import { cn } from '@/lib/utils'

export interface DateTimeLocalPickerProps {
  id?: string
  value?: string // local value: 'YYYY-MM-DDTHH:mm'
  onChange?: (localValue: string) => void
  onISOChange?: (iso: string | null) => void
  className?: string
  error?: string | null
  placeholder?: string
  ariaDescribedBy?: string | undefined
  disabled?: boolean
  autoFillCurrentDateTime?: boolean // Auto-fill current date/time when opening popover for the first time if value is empty
}

const pad = (n: number) => String(n).padStart(2, '0')

export default function DateTimeLocalPicker({
  id,
  value = '',
  onChange,
  onISOChange,
  className,
  error,
  placeholder,
  ariaDescribedBy,
  disabled,
  autoFillCurrentDateTime = true,
}: DateTimeLocalPickerProps) {
  const { t, locale } = useLocale()
  const dateFnsLocale = locale === 'vi' ? vi : enUS

  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [hasAutoFilled, setHasAutoFilled] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [month, setMonth] = useState<Date>(() => new Date())
  const [hour, setHour] = useState('')
  const [minute, setMinute] = useState('')

  const popoverContentId = useId()
  const selectHourContentId = useId()
  const selectMinuteContentId = useId()
  const generatedIdBase = useId()
  const baseId = id ?? generatedIdBase
  const errorId = `${baseId}-error`

  // Fix hydration: Only render interactive parts after mount
  useEffect(() => {
    const timeoutId = window.setTimeout(() => setMounted(true), 0)
    return () => window.clearTimeout(timeoutId)
  }, [])

  // Parse value to state
  useEffect(() => {
    let timeoutId: number | undefined

    if (value && value.length >= 16) {
      try {
        const parsed = new Date(value)
        if (!isNaN(parsed.getTime())) {
          timeoutId = window.setTimeout(() => {
            setDate(parsed)
            setMonth(parsed)
            setHour(String(parsed.getHours()))
            setMinute(String(parsed.getMinutes()))
            setHasAutoFilled(true)
          }, 0)
        }
      } catch {
        // ignore invalid value
      }
    } else {
      timeoutId = window.setTimeout(() => {
        setDate(undefined)
        setHour('')
        setMinute('')
        setHasAutoFilled(false)
      }, 0)
    }

    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    }
  }, [value])

  // Auto-fill current date/time when opening popover for the first time if value is empty
  useEffect(() => {
    if (!open || !autoFillCurrentDateTime || hasAutoFilled || value) return

    const now = new Date()
    const year = now.getFullYear()
    const monthPart = pad(now.getMonth() + 1)
    const dayPart = pad(now.getDate())
    const hourPart = pad(now.getHours())
    const minutePart = pad(now.getMinutes())
    const localValue = `${year}-${monthPart}-${dayPart}T${hourPart}:${minutePart}`

    const timeoutId = window.setTimeout(() => {
      setDate(now)
      setMonth(now)
      setHour(String(now.getHours()))
      setMinute(String(now.getMinutes()))
      setHasAutoFilled(true)

      onChange?.(localValue)
      if (onISOChange) {
        const dateObj = new Date(localValue)
        onISOChange(isNaN(dateObj.getTime()) ? null : dateObj.toISOString())
      }
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [open, autoFillCurrentDateTime, hasAutoFilled, value, onChange, onISOChange])

  // Keep month view synced when reopening
  useEffect(() => {
    if (open && date) setMonth(date)
  }, [open, date])

  const commitValue = (d: Date | undefined, h: string, m: string) => {
    if (!d || !h || !m) {
      onChange?.('')
      onISOChange?.(null)
      return
    }

    const year = d.getFullYear()
    const monthPart = pad(d.getMonth() + 1)
    const dayPart = pad(d.getDate())
    const localValue = `${year}-${monthPart}-${dayPart}T${pad(Number(h))}:${pad(Number(m))}`

    onChange?.(localValue)
    if (onISOChange) {
      const dateObj = new Date(localValue)
      onISOChange(isNaN(dateObj.getTime()) ? null : dateObj.toISOString())
    }
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate && hour && minute) {
      commitValue(selectedDate, hour, minute)
    }
  }

  const handleHourChange = (newHour: string) => {
    const mapped = newHour === '__clear' ? '' : newHour
    setHour(mapped)
    if (date && mapped && minute) {
      commitValue(date, mapped, minute)
    }
  }

  const handleMinuteChange = (newMinute: string) => {
    const mapped = newMinute === '__clear' ? '' : newMinute
    setMinute(mapped)
    if (date && hour && mapped) {
      commitValue(date, hour, mapped)
    }
  }

  const clear = () => {
    setDate(undefined)
    setHour('')
    setMinute('')
    onChange?.('')
    onISOChange?.(null)
  }

  const displayValue = () => {
    if (!date || !hour || !minute) return ''
    try {
      return `${format(date, 'P', { locale: dateFnsLocale })} ${pad(Number(hour))}:${pad(Number(minute))}`
    } catch {
      return ''
    }
  }

  const display = displayValue()

  const CustomCaption = (
    props: {
      calendarMonth: CalendarMonth
      displayIndex?: number
    } & React.HTMLAttributes<HTMLDivElement>
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { calendarMonth, displayIndex: _displayIndex, ...htmlProps } = props
    const monthDate = (calendarMonth as unknown as { date: Date }).date || new Date()
    const currentYear = monthDate.getFullYear()
    const currentMonth = monthDate.getMonth()
    const [yearInput, setYearInput] = useState(String(currentYear))

    useEffect(() => setYearInput(String(currentYear)), [currentYear])

    const monthLabel = (year: number, monthIndex: number) =>
      format(new Date(year, monthIndex, 1), 'LLLL', { locale: dateFnsLocale })

    const changeYear = (year: number) => {
      if (year > 1999 && year <= 2100) setMonth(new Date(year, currentMonth, 1))
    }

    const changeMonth = (monthIndex: string) =>
      setMonth(new Date(currentYear, parseInt(monthIndex, 10), 1))

    return (
      <div
        {...htmlProps}
        className={cn(
          'relative z-50 mb-2 flex items-center justify-center gap-2',
          htmlProps.className
        )}
      >
        <button
          type="button"
          onClick={() => setMonth(new Date(currentYear, currentMonth - 1, 1))}
          disabled={disabled}
          className="hover:bg-accent absolute left-0 z-50 flex h-8 w-8 items-center justify-center rounded-md disabled:opacity-50"
          aria-label={t('datetime.picker.prev_month')}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="relative z-50">
          <Select value={String(currentMonth)} onValueChange={changeMonth}>
            <SelectTrigger className="relative z-50 h-8 w-32 text-sm">
              <SelectValue>{monthLabel(currentYear, currentMonth)}</SelectValue>
            </SelectTrigger>
            <SelectContent className="z-[999999]">
              {Array.from({ length: 12 }).map((_, i) => (
                <SelectItem key={i} value={String(i)}>
                  {monthLabel(currentYear, i)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Input
          type="text"
          inputMode="numeric"
          value={yearInput}
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, '')
            if (next.length <= 4) setYearInput(next)
          }}
          onBlur={() => {
            const year = parseInt(yearInput, 10)
            if (!isNaN(year) && yearInput.length === 4 && year > 1999) {
              changeYear(year)
            } else {
              setYearInput(String(currentYear))
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
          className="relative z-50 h-8 w-20 text-center text-sm font-medium"
          placeholder={t('datetime.picker.year')}
          disabled={disabled}
          maxLength={4}
        />

        <button
          type="button"
          onClick={() => setMonth(new Date(currentYear, currentMonth + 1, 1))}
          disabled={disabled}
          className="hover:bg-accent absolute right-0 z-50 flex h-8 w-8 items-center justify-center rounded-md disabled:opacity-50"
          aria-label={t('datetime.picker.next_month')}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    )
  }

  // Render simple input on server, full component on client
  if (!mounted) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="relative">
          <Input
            value={display}
            readOnly
            placeholder={placeholder || t('datetime.picker.placeholder')}
            className={cn(
              'cursor-pointer pr-10',
              !display && 'text-muted-foreground',
              error && 'border-destructive'
            )}
            disabled={disabled}
          />
          <div className="pointer-events-none absolute top-0 right-0 flex h-full items-center pr-3">
            <CalendarIcon className="text-muted-foreground h-4 w-4" />
          </div>
        </div>
        {error && (
          <div className="bg-destructive/10 border-destructive/20 rounded-md border px-3 py-2">
            <p className="text-destructive text-sm font-medium">{error}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('mt-2 space-y-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative" aria-controls={popoverContentId}>
            <Input
              id={baseId}
              value={display}
              readOnly
              placeholder={placeholder || t('datetime.picker.placeholder')}
              className={cn(
                'cursor-pointer pr-10',
                !display && 'text-muted-foreground',
                error && 'border-destructive focus-visible:ring-destructive'
              )}
              disabled={disabled}
              onClick={() => !disabled && setOpen(true)}
              aria-invalid={Boolean(error)}
              aria-describedby={ariaDescribedBy ?? (error ? errorId : undefined)}
            />

            <div className="pointer-events-none absolute top-0 right-0 flex h-full items-center pr-3">
              {display && !disabled ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="pointer-events-auto h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation()
                    clear()
                  }}
                  tabIndex={-1}
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : (
                <CalendarIcon className="text-muted-foreground h-4 w-4" />
              )}
            </div>
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="z-[9999] w-auto p-0"
          align="start"
          sideOffset={4}
          id={popoverContentId}
        >
          <div className="flex flex-col sm:flex-row">
            <div className="p-3">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                month={month}
                onMonthChange={setMonth}
                disabled={disabled}
                locale={dateFnsLocale}
                captionLayout="label"
                components={{
                  MonthCaption: CustomCaption,
                }}
              />
            </div>

            <div className="min-w-[200px] space-y-4 border-t p-4 sm:border-t-0 sm:border-l">
              <div className="flex items-center gap-2 border-b pb-2">
                <Clock className="text-muted-foreground h-4 w-4" />
                <span className="text-sm font-medium">{t('datetime.picker.time')}</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor={`${baseId}-hour`} className="text-xs">
                    {t('datetime.picker.hour')}
                  </Label>
                  <Select value={hour} onValueChange={handleHourChange} disabled={disabled}>
                    <SelectTrigger
                      id={`${baseId}-hour`}
                      className="h-9 w-full text-sm"
                      aria-controls={selectHourContentId}
                    >
                      <SelectValue placeholder="--" />
                    </SelectTrigger>
                    <SelectContent id={selectHourContentId}>
                      <SelectItem value="__clear">--</SelectItem>
                      {Array.from({ length: 24 }).map((_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {pad(i)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${baseId}-minute`} className="text-xs">
                    {t('datetime.picker.minute')}
                  </Label>
                  <Select value={minute} onValueChange={handleMinuteChange} disabled={disabled}>
                    <SelectTrigger
                      id={`${baseId}-minute`}
                      className="h-9 w-full text-sm"
                      aria-controls={selectMinuteContentId}
                    >
                      <SelectValue placeholder="--" />
                    </SelectTrigger>
                    <SelectContent id={selectMinuteContentId}>
                      <SelectItem value="__clear">--</SelectItem>
                      {Array.from({ length: 60 }).map((_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {pad(i)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {date && hour && minute && (
                <div className="border-t pt-3">
                  <p className="text-muted-foreground mb-1 text-xs">
                    {t('datetime.picker.selected')}
                  </p>
                  <p className="text-sm font-medium">{display}</p>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                className="w-full"
              >
                {t('datetime.picker.done')}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {error && (
        <div className="bg-destructive/10 border-destructive/20 rounded-md border px-3 py-2">
          <p id={errorId} className="text-destructive text-sm font-medium">
            {error}
          </p>
        </div>
      )}
    </div>
  )
}
