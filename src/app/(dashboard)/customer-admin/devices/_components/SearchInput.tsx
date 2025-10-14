'use client'

import { useState, useCallback, memo } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SearchInputProps {
  placeholder?: string
  onSearch: (query: string) => void
  className?: string
}

function SearchInputComponent({ placeholder, onSearch, className }: SearchInputProps) {
  const [value, setValue] = useState('')

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setValue(newValue)

      // Debounce search
      const timeoutId = setTimeout(() => {
        onSearch(newValue)
      }, 300)

      return () => clearTimeout(timeoutId)
    },
    [onSearch]
  )

  return (
    <div className={`relative max-w-sm flex-1 ${className}`}>
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <Input
        placeholder={placeholder || 'Tìm kiếm...'}
        className="focus-visible:ring-brand-500/20 h-10 rounded-xl border-2 pl-10"
        value={value}
        onChange={handleChange}
      />
    </div>
  )
}

export const SearchInput = memo(SearchInputComponent)
