'use client'

import { useEffect, useState } from 'react'

export default function DynamicAttributesFields() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(t)
  }, [])

  if (!mounted) return null

  return null
}
