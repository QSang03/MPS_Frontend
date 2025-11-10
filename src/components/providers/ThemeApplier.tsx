'use client'

import { useEffect } from 'react'
import { useUIStore } from '@/lib/store/uiStore'

export default function ThemeApplier() {
  const themeColor = useUIStore((s) => s.themeColor)
  const fontFamily = useUIStore((s) => s.fontFamily)

  useEffect(() => {
    if (themeColor) {
      // set brand primary to chosen color
      document.documentElement.style.setProperty('--brand-500', themeColor)
      document.documentElement.style.setProperty('--primary', themeColor)
      document.documentElement.style.setProperty('--ring', themeColor)
    } else {
      // clear overrides
      document.documentElement.style.removeProperty('--brand-500')
      document.documentElement.style.removeProperty('--primary')
      document.documentElement.style.removeProperty('--ring')
    }
  }, [themeColor])

  useEffect(() => {
    // Map font selection to CSS variables defined by next/font in RootLayout
    // --font-inter, --font-poppins, --font-mono are available; we swap which variable is used for --font-sans
    if (fontFamily === 'poppins') {
      document.documentElement.style.setProperty('--font-sans', 'var(--font-poppins)')
      document.documentElement.style.setProperty('--font-display', 'var(--font-poppins)')
    } else if (fontFamily === 'mono') {
      document.documentElement.style.setProperty('--font-sans', 'var(--font-mono)')
      document.documentElement.style.setProperty('--font-display', 'var(--font-mono)')
    } else {
      document.documentElement.style.setProperty('--font-sans', 'var(--font-inter)')
      document.documentElement.style.setProperty('--font-display', 'var(--font-poppins)')
    }
  }, [fontFamily])

  return null
}
