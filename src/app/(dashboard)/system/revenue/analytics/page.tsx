'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AnalyticsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main revenue page - the tab will be set by the main page based on pathname
    router.replace('/system/revenue')
  }, [router])

  return null
}
