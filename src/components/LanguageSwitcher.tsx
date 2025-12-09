'use client'

import React from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()
  const [mounted, setMounted] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    setMounted(true)
  }, [])
  return (
    <div className="flex items-center gap-2" suppressHydrationWarning>
      <Button
        size="sm"
        variant={mounted ? (locale === 'vi' ? 'default' : 'ghost') : 'ghost'}
        onClick={() => {
          setLocale('vi')
          try {
            // Set cookie so server can observe locale on subsequent requests
            document.cookie = `mps_locale=vi; path=/`
          } catch {}
          // Refresh server components and routes so new locale is applied
          try {
            router.refresh()
          } catch {}
        }}
      >
        VN
      </Button>
      <Button
        size="sm"
        variant={mounted ? (locale === 'en' ? 'default' : 'ghost') : 'ghost'}
        onClick={() => {
          setLocale('en')
          try {
            document.cookie = `mps_locale=en; path=/`
          } catch {}
          try {
            router.refresh()
          } catch {}
        }}
      >
        EN
      </Button>
    </div>
  )
}
