/**
 * Theme Utility Functions
 * Generates color palettes from a base color for dynamic theming
 */

/**
 * Theme preset interface - complete theme definition
 */
export interface ThemePreset {
  id: string
  name: string
  colors: {
    // Primary brand color
    primary: string
    primaryForeground: string
    // Secondary
    secondary: string
    secondaryForeground: string
    // Background & foreground
    background: string
    foreground: string
    // Card
    card: string
    cardForeground: string
    // Muted
    muted: string
    mutedForeground: string
    // Accent
    accent: string
    accentForeground: string
    // Border & input
    border: string
    input: string
    ring: string
    // Sidebar
    sidebar: string
    sidebarForeground: string
    sidebarPrimary: string
    sidebarPrimaryForeground: string
    sidebarAccent: string
    sidebarAccentForeground: string
    sidebarBorder: string
    // Brand palette
    brand50: string
    brand100: string
    brand200: string
    brand300: string
    brand400: string
    brand500: string
    brand600: string
    brand700: string
    brand800: string
    brand900: string
  }
}

/**
 * Predefined theme presets
 */
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'sky',
    name: 'Sky Blue',
    colors: {
      primary: '#0ea5e9',
      primaryForeground: '#ffffff',
      secondary: '#e0f2fe',
      secondaryForeground: '#0c4a6e',
      background: '#ffffff',
      foreground: '#0f172a',
      card: '#ffffff',
      cardForeground: '#0f172a',
      muted: '#f1f5f9',
      mutedForeground: '#64748b',
      accent: '#f0f9ff',
      accentForeground: '#0c4a6e',
      border: '#e2e8f0',
      input: '#e2e8f0',
      ring: '#0ea5e9',
      sidebar: '#f8fafc',
      sidebarForeground: '#0f172a',
      sidebarPrimary: '#0ea5e9',
      sidebarPrimaryForeground: '#ffffff',
      sidebarAccent: '#f0f9ff',
      sidebarAccentForeground: '#0c4a6e',
      sidebarBorder: '#e2e8f0',
      brand50: '#f0f9ff',
      brand100: '#e0f2fe',
      brand200: '#bae6fd',
      brand300: '#7dd3fc',
      brand400: '#38bdf8',
      brand500: '#0ea5e9',
      brand600: '#0284c7',
      brand700: '#0369a1',
      brand800: '#075985',
      brand900: '#0c4a6e',
    },
  },
  {
    id: 'cyan',
    name: 'Cyan',
    colors: {
      primary: '#06b6d4',
      primaryForeground: '#ffffff',
      secondary: '#cffafe',
      secondaryForeground: '#164e63',
      background: '#ffffff',
      foreground: '#0f172a',
      card: '#ffffff',
      cardForeground: '#0f172a',
      muted: '#f1f5f9',
      mutedForeground: '#64748b',
      accent: '#ecfeff',
      accentForeground: '#164e63',
      border: '#e2e8f0',
      input: '#e2e8f0',
      ring: '#06b6d4',
      sidebar: '#f8fafc',
      sidebarForeground: '#0f172a',
      sidebarPrimary: '#06b6d4',
      sidebarPrimaryForeground: '#ffffff',
      sidebarAccent: '#ecfeff',
      sidebarAccentForeground: '#164e63',
      sidebarBorder: '#e2e8f0',
      brand50: '#ecfeff',
      brand100: '#cffafe',
      brand200: '#a5f3fc',
      brand300: '#67e8f9',
      brand400: '#22d3ee',
      brand500: '#06b6d4',
      brand600: '#0891b2',
      brand700: '#0e7490',
      brand800: '#155e75',
      brand900: '#164e63',
    },
  },
  {
    id: 'violet',
    name: 'Violet',
    colors: {
      primary: '#7c3aed',
      primaryForeground: '#ffffff',
      secondary: '#ede9fe',
      secondaryForeground: '#4c1d95',
      background: '#ffffff',
      foreground: '#1e1b4b',
      card: '#ffffff',
      cardForeground: '#1e1b4b',
      muted: '#f5f3ff',
      mutedForeground: '#6b7280',
      accent: '#f5f3ff',
      accentForeground: '#4c1d95',
      border: '#e5e7eb',
      input: '#e5e7eb',
      ring: '#7c3aed',
      sidebar: '#faf5ff',
      sidebarForeground: '#1e1b4b',
      sidebarPrimary: '#7c3aed',
      sidebarPrimaryForeground: '#ffffff',
      sidebarAccent: '#f5f3ff',
      sidebarAccentForeground: '#4c1d95',
      sidebarBorder: '#e9d5ff',
      brand50: '#f5f3ff',
      brand100: '#ede9fe',
      brand200: '#ddd6fe',
      brand300: '#c4b5fd',
      brand400: '#a78bfa',
      brand500: '#7c3aed',
      brand600: '#6d28d9',
      brand700: '#5b21b6',
      brand800: '#4c1d95',
      brand900: '#3b0764',
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    colors: {
      primary: '#e11d48',
      primaryForeground: '#ffffff',
      secondary: '#ffe4e6',
      secondaryForeground: '#881337',
      background: '#ffffff',
      foreground: '#1f2937',
      card: '#ffffff',
      cardForeground: '#1f2937',
      muted: '#fff1f2',
      mutedForeground: '#6b7280',
      accent: '#fff1f2',
      accentForeground: '#881337',
      border: '#fecdd3',
      input: '#fecdd3',
      ring: '#e11d48',
      sidebar: '#fff1f2',
      sidebarForeground: '#1f2937',
      sidebarPrimary: '#e11d48',
      sidebarPrimaryForeground: '#ffffff',
      sidebarAccent: '#ffe4e6',
      sidebarAccentForeground: '#881337',
      sidebarBorder: '#fecdd3',
      brand50: '#fff1f2',
      brand100: '#ffe4e6',
      brand200: '#fecdd3',
      brand300: '#fda4af',
      brand400: '#fb7185',
      brand500: '#e11d48',
      brand600: '#be123c',
      brand700: '#9f1239',
      brand800: '#881337',
      brand900: '#4c0519',
    },
  },
  {
    id: 'emerald',
    name: 'Emerald',
    colors: {
      primary: '#10b981',
      primaryForeground: '#ffffff',
      secondary: '#d1fae5',
      secondaryForeground: '#064e3b',
      background: '#ffffff',
      foreground: '#1f2937',
      card: '#ffffff',
      cardForeground: '#1f2937',
      muted: '#f0fdf4',
      mutedForeground: '#6b7280',
      accent: '#ecfdf5',
      accentForeground: '#064e3b',
      border: '#a7f3d0',
      input: '#d1fae5',
      ring: '#10b981',
      sidebar: '#f0fdf4',
      sidebarForeground: '#1f2937',
      sidebarPrimary: '#10b981',
      sidebarPrimaryForeground: '#ffffff',
      sidebarAccent: '#d1fae5',
      sidebarAccentForeground: '#064e3b',
      sidebarBorder: '#a7f3d0',
      brand50: '#ecfdf5',
      brand100: '#d1fae5',
      brand200: '#a7f3d0',
      brand300: '#6ee7b7',
      brand400: '#34d399',
      brand500: '#10b981',
      brand600: '#059669',
      brand700: '#047857',
      brand800: '#065f46',
      brand900: '#064e3b',
    },
  },
  {
    id: 'slate',
    name: 'Slate Dark',
    colors: {
      primary: '#475569',
      primaryForeground: '#ffffff',
      secondary: '#e2e8f0',
      secondaryForeground: '#1e293b',
      background: '#ffffff',
      foreground: '#0f172a',
      card: '#ffffff',
      cardForeground: '#0f172a',
      muted: '#f1f5f9',
      mutedForeground: '#64748b',
      accent: '#f1f5f9',
      accentForeground: '#1e293b',
      border: '#cbd5e1',
      input: '#cbd5e1',
      ring: '#475569',
      sidebar: '#f8fafc',
      sidebarForeground: '#0f172a',
      sidebarPrimary: '#475569',
      sidebarPrimaryForeground: '#ffffff',
      sidebarAccent: '#f1f5f9',
      sidebarAccentForeground: '#1e293b',
      sidebarBorder: '#e2e8f0',
      brand50: '#f8fafc',
      brand100: '#f1f5f9',
      brand200: '#e2e8f0',
      brand300: '#cbd5e1',
      brand400: '#94a3b8',
      brand500: '#64748b',
      brand600: '#475569',
      brand700: '#334155',
      brand800: '#1e293b',
      brand900: '#0f172a',
    },
  },
]

/**
 * Get theme preset by ID
 */
export function getThemePreset(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find((t) => t.id === id)
}

/**
 * Convert hex color to HSL
 */
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // Remove the hash if present
  hex = hex.replace(/^#/, '')

  // Parse the hex values
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

/**
 * Convert HSL to hex color
 */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let r = 0
  let g = 0
  let b = 0

  if (h >= 0 && h < 60) {
    r = c
    g = x
    b = 0
  } else if (h >= 60 && h < 120) {
    r = x
    g = c
    b = 0
  } else if (h >= 120 && h < 180) {
    r = 0
    g = c
    b = x
  } else if (h >= 180 && h < 240) {
    r = 0
    g = x
    b = c
  } else if (h >= 240 && h < 300) {
    r = x
    g = 0
    b = c
  } else if (h >= 300 && h < 360) {
    r = c
    g = 0
    b = x
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Generate a color palette from a base color
 * Returns shades from 50 to 950 based on the input color
 */
export function generatePalette(baseColor: string): Record<string, string> {
  const { h, s } = hexToHSL(baseColor)

  // Define lightness values for each shade
  // 50 is lightest, 950 is darkest
  const shades: Record<string, number> = {
    '50': 97,
    '100': 94,
    '200': 86,
    '300': 74,
    '400': 60,
    '500': 48, // Base color approximation
    '600': 40,
    '700': 32,
    '800': 24,
    '900': 16,
    '950': 10,
  }

  // Adjust saturation based on lightness for more natural colors
  const getSaturation = (lightness: number): number => {
    if (lightness > 90) return Math.max(s * 0.3, 30) // Very light - low saturation
    if (lightness > 70) return Math.max(s * 0.6, 40)
    if (lightness > 40) return s // Mid tones - full saturation
    if (lightness > 20) return Math.min(s * 1.1, 100) // Dark - slightly higher saturation
    return Math.min(s * 0.9, 100) // Very dark - moderate saturation
  }

  const palette: Record<string, string> = {}

  for (const [shade, lightness] of Object.entries(shades)) {
    const adjustedSaturation = getSaturation(lightness)
    palette[shade] = hslToHex(h, adjustedSaturation, lightness)
  }

  return palette
}

/**
 * Get contrasting text color (black or white) for a given background color
 */
export function getContrastColor(hexColor: string): string {
  const { l } = hexToHSL(hexColor)
  return l > 50 ? '#000000' : '#ffffff'
}

/**
 * Check if a string is a valid hex color
 */
export function isValidHexColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}){1,2}$/.test(color)
}
