'use client'

import React from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { Button } from '@/components/ui/button'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])
  return (
    <div className="flex items-center gap-2" suppressHydrationWarning>
      <Button
        size="sm"
        variant={mounted ? (locale === 'vi' ? 'default' : 'ghost') : 'ghost'}
        onClick={() => setLocale('vi')}
      >
        VN
      </Button>
      <Button
        size="sm"
        variant={mounted ? (locale === 'en' ? 'default' : 'ghost') : 'ghost'}
        onClick={() => setLocale('en')}
      >
        EN
      </Button>
    </div>
  )
}
