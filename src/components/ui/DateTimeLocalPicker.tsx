'use client'

import React, { useState, useEffect, useId } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Calendar as CalendarIcon, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

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
}: DateTimeLocalPickerProps) {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [hour, setHour] = useState('')
  const [minute, setMinute] = useState('')
  const popoverContentId = useId()
  const selectHourContentId = useId()
  const selectMinuteContentId = useId()
  const generatedIdBase = useId()
  const baseId = id ?? generatedIdBase

  // Fix hydration: Only render interactive parts after mount
  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 0)
    return () => window.clearTimeout(t)
  }, [])

  // Parse value to state
  useEffect(() => {
    let t: number | undefined
    if (value && value.length >= 16) {
      try {
        const d = new Date(value)
        if (!isNaN(d.getTime())) {
          t = window.setTimeout(() => {
            setDate(d)
            setHour(String(d.getHours()))
            setMinute(String(d.getMinutes()))
          }, 0)
        }
      } catch {
        // Invalid date
      }
    } else {
      t = window.setTimeout(() => {
        setDate(undefined)
        setHour('')
        setMinute('')
      }, 0)
    }
    return () => {
      if (t !== undefined) window.clearTimeout(t)
    }
  }, [value])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    commitValue(selectedDate, hour, minute)
  }

  const handleHourChange = (newHour: string) => {
    // map sentinel value back to empty string
    const mapped = newHour === '__clear' ? '' : newHour
    setHour(mapped)
    commitValue(date, mapped, minute)
  }

  const handleMinuteChange = (newMinute: string) => {
    // map sentinel value back to empty string
    const mapped = newMinute === '__clear' ? '' : newMinute
    setMinute(mapped)
    commitValue(date, hour, mapped)
  }

  const commitValue = (d: Date | undefined, h: string, m: string) => {
    // VALIDATE: Phải có đủ cả date, hour, minute
    if (!d || !h || !m) {
      if (onChange) onChange('')
      if (onISOChange) onISOChange(null)
      return
    }

    // Tạo datetime string
    const year = d.getFullYear()
    const month = pad(d.getMonth() + 1)
    const day = pad(d.getDate())
    const localValue = `${year}-${month}-${day}T${pad(Number(h))}:${pad(Number(m))}`

    if (onChange) onChange(localValue)
    if (onISOChange) {
      const dateObj = new Date(localValue)
      onISOChange(isNaN(dateObj.getTime()) ? null : dateObj.toISOString())
    }
  }

  const clear = () => {
    setDate(undefined)
    setHour('')
    setMinute('')
    if (onChange) onChange('')
    if (onISOChange) onISOChange(null)
  }

  // Display format
  const displayValue = () => {
    if (!date || !hour || !minute) return ''
    try {
      return `${format(date, 'dd/MM/yyyy', { locale: vi })} ${pad(Number(hour))}:${pad(Number(minute))}`
    } catch {
      return ''
    }
  }

  const display = displayValue()

  // Render simple input on server, full component on client
  if (!mounted) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="relative">
          <Input
            value={display}
            readOnly
            placeholder={placeholder || 'Chọn ngày và giờ'}
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
              id={id}
              value={display}
              readOnly
              placeholder={placeholder || 'Chọn ngày và giờ'}
              className={cn(
                'cursor-pointer pr-10',
                !display && 'text-muted-foreground',
                error && 'border-destructive focus-visible:ring-destructive'
              )}
              disabled={disabled}
              onClick={() => !disabled && setOpen(true)}
              aria-invalid={Boolean(error)}
              aria-describedby={ariaDescribedBy ?? (error ? `${id}-error` : undefined)}
            />

            <div className="pointer-events-none absolute top-0 right-0 flex h-full items-center pr-3">
              {display && !disabled ? (
                <Button
                  type="button"
                  variant="ghost"
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
            {/* Calendar */}
            <div className="p-3">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                disabled={disabled}
                initialFocus
                locale={vi}
              />
            </div>

            {/* Time Picker */}
            <div className="min-w-[200px] space-y-4 border-t p-4 sm:border-t-0 sm:border-l">
              <div className="flex items-center gap-2 border-b pb-2">
                <Clock className="text-muted-foreground h-4 w-4" />
                <span className="text-sm font-medium">Thời gian</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor={`${baseId}-hour`} className="text-xs">
                    Giờ
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
                    Phút
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
                        <SelectItem key={i} value={String(i * 1)}>
                          {pad(i * 1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview */}
              {date && hour && minute && (
                <div className="border-t pt-3">
                  <p className="text-muted-foreground mb-1 text-xs">Đã chọn:</p>
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
                Xong
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border-destructive/20 rounded-md border px-3 py-2">
          <p id={`${id}-error`} className="text-destructive text-sm font-medium">
            {error}
          </p>
        </div>
      )}
    </div>
  )
}
