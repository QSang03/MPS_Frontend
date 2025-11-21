import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Option = {
  value: string
  label: React.ReactNode
  icon?: React.ReactNode
}

type Props = {
  value: string
  onChange: (v: string) => void
  options: Option[]
  placeholder?: string
  className?: string
  width?: string
}

export default function FilterDropdown({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  width = 'w-[160px]',
}: Props) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`${width} ${className}`}>
        <SelectValue placeholder={placeholder}>
          {value === 'all' ? placeholder : options.find((o) => o.value === value)?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder ?? 'Tất cả'}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={String(opt.value)} value={opt.value}>
            <div className="flex items-center gap-2">
              {opt.icon}
              {opt.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
