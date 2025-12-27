import { format, formatDistance } from 'date-fns'

/**
 * Format date to readable string
 */
export function formatDate(
  date: string | Date | null | undefined,
  pattern = 'MMM dd, yyyy'
): string {
  if (date === null || date === undefined || date === '') return '-'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return '-'
  return format(parsed, pattern)
}

/**
 * Format date to datetime string
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'MMM dd, yyyy HH:mm')
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (date === null || date === undefined || date === '') return '-'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return '-'
  return formatDistance(parsed, new Date(), { addSuffix: true })
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number | null | undefined): string {
  if (typeof num !== 'number' || !Number.isFinite(num)) return '-'
  return new Intl.NumberFormat('en-US').format(num)
}

import type { CurrencyDataDto } from '@/types/models/currency'

/**
 * Format currency with symbol
 */
export function formatCurrencyWithSymbol(
  amount: number,
  currency?: CurrencyDataDto | null
): string {
  if (!currency || !currency.symbol) {
    return formatCurrency(amount, 'USD')
  }
  return `${currency.symbol} ${new Intl.NumberFormat('en-US').format(amount)}`
}

/**
 * Format currency with code
 */
export function formatCurrencyWithCode(amount: number, currency?: CurrencyDataDto | null): string {
  const code = currency?.code || 'USD'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code,
  }).format(amount)
}

/**
 * Format currency
 * Supports both string currency code and CurrencyDataDto object
 */
export function formatCurrency(
  amount: number,
  currency: string | CurrencyDataDto | null | undefined = 'USD'
): string {
  if (typeof currency === 'string') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }
  if (currency && typeof currency === 'object' && 'code' in currency) {
    return formatCurrencyWithCode(amount, currency)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Format page count in a human-friendly way, distinguishing between
 * - no data (hasData=false) => N/A
 * - value is null/undefined => N/A
 * - 0 => 0 (meaning real zero)
 * Returns an object with display and optional tooltip for UX clarity.
 */
export function formatPageCount(
  value: number | null | undefined,
  hasData?: boolean
): { display: string; tooltip?: string | null } {
  if (hasData === false) {
    return { display: 'N/A', tooltip: 'Chưa có dữ liệu' }
  }
  if (value === null || value === undefined) {
    return { display: 'N/A', tooltip: 'Chưa được tính toán' }
  }
  if (value === 0) {
    return { display: '0', tooltip: 'Không có trang in trong kỳ' }
  }
  return { display: value.toLocaleString('vi-VN'), tooltip: null }
}
