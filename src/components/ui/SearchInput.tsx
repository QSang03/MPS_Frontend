import React from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

type Props = {
  value: string
  onValueChange: (v: string) => void
  placeholder?: string
  className?: string
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
}

export default function SearchInput({
  value,
  onValueChange,
  placeholder,
  className = '',
  onKeyDown,
}: Props) {
  const { t } = useLocale()
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="pl-9"
      />

      {value && (
        <div className="absolute top-1/2 right-1 -translate-y-1/2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => onValueChange('')}
            aria-label={t('aria.clear_search')}
          >
            <X className="h-4 w-4 text-slate-500" />
          </Button>
        </div>
      )}
    </div>
  )
}
