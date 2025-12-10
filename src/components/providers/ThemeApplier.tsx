'use client'

import { useEffect } from 'react'
import { useUIStore } from '@/lib/store/uiStore'
import { getThemePreset, THEME_PRESETS, type ThemePreset } from '@/lib/theme-utils'

/**
 * Apply a complete theme preset to CSS variables
 */
function applyThemePreset(theme: ThemePreset) {
  const root = document.documentElement
  const colors = theme.colors

  // Primary
  root.style.setProperty('--primary', colors.primary)
  root.style.setProperty('--primary-foreground', colors.primaryForeground)

  // Secondary
  root.style.setProperty('--secondary', colors.secondary)
  root.style.setProperty('--secondary-foreground', colors.secondaryForeground)

  // Background & foreground
  root.style.setProperty('--background', colors.background)
  root.style.setProperty('--foreground', colors.foreground)

  // Card
  root.style.setProperty('--card', colors.card)
  root.style.setProperty('--card-foreground', colors.cardForeground)

  // Popover (same as card)
  root.style.setProperty('--popover', colors.card)
  root.style.setProperty('--popover-foreground', colors.cardForeground)

  // Muted
  root.style.setProperty('--muted', colors.muted)
  root.style.setProperty('--muted-foreground', colors.mutedForeground)

  // Accent
  root.style.setProperty('--accent', colors.accent)
  root.style.setProperty('--accent-foreground', colors.accentForeground)

  // Border, input, ring
  root.style.setProperty('--border', colors.border)
  root.style.setProperty('--input', colors.input)
  root.style.setProperty('--ring', colors.ring)

  // Sidebar
  root.style.setProperty('--sidebar', colors.sidebar)
  root.style.setProperty('--sidebar-foreground', colors.sidebarForeground)
  root.style.setProperty('--sidebar-primary', colors.sidebarPrimary)
  root.style.setProperty('--sidebar-primary-foreground', colors.sidebarPrimaryForeground)
  root.style.setProperty('--sidebar-accent', colors.sidebarAccent)
  root.style.setProperty('--sidebar-accent-foreground', colors.sidebarAccentForeground)
  root.style.setProperty('--sidebar-border', colors.sidebarBorder)
  root.style.setProperty('--sidebar-ring', colors.ring)

  // Brand palette
  root.style.setProperty('--brand-50', colors.brand50)
  root.style.setProperty('--brand-100', colors.brand100)
  root.style.setProperty('--brand-200', colors.brand200)
  root.style.setProperty('--brand-300', colors.brand300)
  root.style.setProperty('--brand-400', colors.brand400)
  root.style.setProperty('--brand-500', colors.brand500)
  root.style.setProperty('--brand-600', colors.brand600)
  root.style.setProperty('--brand-700', colors.brand700)
  root.style.setProperty('--brand-800', colors.brand800)
  root.style.setProperty('--brand-900', colors.brand900)

  // Button-specific variables (derive sensible hover shades)
  root.style.setProperty('--btn-primary', colors.primary)
  root.style.setProperty('--btn-primary-foreground', colors.primaryForeground)
  root.style.setProperty('--btn-primary-hover', colors.brand600 || colors.brand500)

  root.style.setProperty('--btn-secondary', colors.secondary)
  root.style.setProperty('--btn-secondary-foreground', colors.secondaryForeground)
  root.style.setProperty('--btn-secondary-hover', colors.brand300 || colors.brand200)

  root.style.setProperty('--btn-outline-border', colors.border)
  root.style.setProperty('--btn-ghost-hover', colors.accent || colors.brand50)
}

/**
 * Clear all theme overrides
 */
function clearThemeOverrides() {
  const root = document.documentElement
  const properties = [
    '--primary',
    '--primary-foreground',
    '--secondary',
    '--secondary-foreground',
    '--background',
    '--foreground',
    '--card',
    '--card-foreground',
    '--popover',
    '--popover-foreground',
    '--muted',
    '--muted-foreground',
    '--accent',
    '--accent-foreground',
    '--border',
    '--input',
    '--ring',
    '--sidebar',
    '--sidebar-foreground',
    '--sidebar-primary',
    '--sidebar-primary-foreground',
    '--sidebar-accent',
    '--sidebar-accent-foreground',
    '--sidebar-border',
    '--sidebar-ring',
    '--brand-50',
    '--brand-100',
    '--brand-200',
    '--brand-300',
    '--brand-400',
    '--brand-500',
    '--brand-600',
    '--brand-700',
    '--brand-800',
    '--brand-900',
    // button overrides
    '--btn-primary',
    '--btn-primary-foreground',
    '--btn-primary-hover',
    '--btn-secondary',
    '--btn-secondary-foreground',
    '--btn-secondary-hover',
    '--btn-outline-border',
    '--btn-ghost-hover',
  ]
  properties.forEach((prop) => root.style.removeProperty(prop))
}

export default function ThemeApplier() {
  const themeId = useUIStore((s) => s.themeId)
  const fontFamily = useUIStore((s) => s.fontFamily)

  useEffect(() => {
    if (themeId) {
      const theme = getThemePreset(themeId)
      if (theme) {
        applyThemePreset(theme)
      } else {
        // If theme not found, apply first available theme
        const firstTheme = THEME_PRESETS[0]
        if (firstTheme) {
          applyThemePreset(firstTheme)
        }
      }
    } else {
      // Clear all overrides to use default CSS theme
      clearThemeOverrides()
    }
  }, [themeId])

  useEffect(() => {
    // Map font selection to CSS variables defined by next/font in RootLayout
    // --font-inter, --font-roboto, --font-mono are available; we swap which variable is used
    // for both --font-sans (used in our layout) AND --font-inter (Tailwind compiled class
    // `.font-sans` uses var(--font-inter), so we also override that to ensure immediate UI update).
    const root = document.documentElement
    const body = document.body
    if (fontFamily === 'roboto') {
      const computed = (
        getComputedStyle(body).getPropertyValue('--font-roboto') || 'Roboto, sans-serif'
      ).trim()
      root.style.setProperty('--font-sans', computed)
      root.style.setProperty('--font-inter', computed)
      root.style.setProperty('--font-display', computed)
      if (body) {
        body.style.setProperty('--font-sans', computed)
        body.style.setProperty('--font-inter', computed)
        body.style.setProperty('--font-display', computed)
        body.style.fontFamily = computed
      }
    } else if (fontFamily === 'mono') {
      const computed = (
        getComputedStyle(body).getPropertyValue('--font-mono') || 'monospace'
      ).trim()
      root.style.setProperty('--font-sans', computed)
      root.style.setProperty('--font-inter', computed)
      root.style.setProperty('--font-display', computed)
      if (body) {
        body.style.setProperty('--font-sans', computed)
        body.style.setProperty('--font-inter', computed)
        body.style.setProperty('--font-display', computed)
        body.style.fontFamily = computed
      }
    } else {
      // revert to defaults provided by next/font by removing overrides
      root.style.removeProperty('--font-sans')
      root.style.removeProperty('--font-inter')
      root.style.removeProperty('--font-display')
      if (body) {
        body.style.removeProperty('--font-sans')
        body.style.removeProperty('--font-inter')
        body.style.removeProperty('--font-display')
        body.style.fontFamily = ''
      }
    }
  }, [fontFamily])

  return null
}
