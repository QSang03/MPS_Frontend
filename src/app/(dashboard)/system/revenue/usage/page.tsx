'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UsagePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main revenue page with usage tab
    // The main page will detect the pathname and set the correct tab
    router.replace('/system/revenue?tab=usage')
  }, [router])

  return null
}
