export const colors = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray600: '#4b5563',
  gray700: '#374151',
  gray900: '#111827',
}

export const typography = {
  h1: { fontSize: 24, fontWeight: 700, color: '#1f2937' },
  h2: { fontSize: 18, fontWeight: 600, color: '#1f2937' },
  h3: { fontSize: 14, fontWeight: 600, color: '#374151' },
  body: { fontSize: 14, fontWeight: 400, color: '#1f2937' },
  small: { fontSize: 12, fontWeight: 400, color: '#6b7280' },
  caption: { fontSize: 11, fontWeight: 400, color: '#9ca3af' },
}

export const spacing = {
  page: 24,
  card: 20,
  gapSmall: 12,
  gapMedium: 16,
  gapLarge: 20,
}

const deviceTokens = { colors, typography, spacing }

export default deviceTokens
