import { formatDate } from './formatters'
import type { Device } from '@/types/models/device'

/**
 * Format ownership period để hiển thị
 * @param fromDate - Ngày bắt đầu sở hữu (ISO 8601)
 * @param toDate - Ngày kết thúc sở hữu (ISO 8601 hoặc null)
 * @returns String hiển thị khoảng thời gian
 */
export function formatOwnershipPeriod(fromDate: string, toDate: string | null): string {
  const from = formatDate(fromDate, 'dd/MM/yyyy')
  if (toDate === null) {
    return `Từ ${from} đến nay`
  }
  const to = formatDate(toDate, 'dd/MM/yyyy')
  return `Từ ${from} đến ${to}`
}

/**
 * Kiểm tra date có nằm trong ownership period không
 * @param date - Date string cần kiểm tra (YYYY-MM-DD hoặc ISO 8601)
 * @param period - Ownership period
 * @returns true nếu date nằm trong period
 */
export function isDateInOwnershipPeriod(
  date: string,
  period: { fromDate: string; toDate: string | null }
): boolean {
  const checkDate = new Date(date)
  const fromDate = new Date(period.fromDate)
  const toDate = period.toDate ? new Date(period.toDate) : new Date()

  return checkDate >= fromDate && checkDate <= toDate
}

/**
 * Lấy min/max date cho date picker dựa trên ownership period
 * @param period - Ownership period
 * @returns Object chứa minDate và maxDate (format YYYY-MM-DD)
 */
export function getOwnershipPeriodDateRange(period: { fromDate: string; toDate: string | null }): {
  minDate: string
  maxDate: string
} {
  const fromDate = new Date(period.fromDate)
  const toDate = period.toDate ? new Date(period.toDate) : new Date()

  // Format as YYYY-MM-DD for date input
  const formatForInput = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return {
    minDate: formatForInput(fromDate),
    maxDate: formatForInput(toDate),
  }
}

/**
 * Type guard: Kiểm tra device có phải là thiết bị lịch sử không
 */
export function isHistoricalDevice(device: Device): boolean {
  return device.ownershipStatus === 'historical'
}

/**
 * Type guard: Kiểm tra device có phải là thiết bị hiện tại không
 */
export function isCurrentDevice(device: Device): boolean {
  return device.ownershipStatus === 'current' || !device.ownershipStatus
}

/**
 * Validate date range có nằm trong ownership period không
 * @param fromDate - Ngày bắt đầu (YYYY-MM-DD)
 * @param toDate - Ngày kết thúc (YYYY-MM-DD)
 * @param period - Ownership period
 * @returns Object chứa isValid và error message (nếu có)
 */
export function validateDateRangeAgainstOwnershipPeriod(
  fromDate: string,
  toDate: string,
  period: { fromDate: string; toDate: string | null }
): { isValid: boolean; error?: string } {
  const from = new Date(fromDate)
  const to = new Date(toDate)
  const periodFrom = new Date(period.fromDate)
  const periodTo = period.toDate ? new Date(period.toDate) : new Date()

  if (from < periodFrom) {
    return {
      isValid: false,
      error: `Ngày bắt đầu phải từ ${formatDate(period.fromDate, 'dd/MM/yyyy')} trở đi`,
    }
  }

  if (to > periodTo) {
    const maxDateStr = period.toDate ? formatDate(period.toDate, 'dd/MM/yyyy') : 'ngày hiện tại'
    return {
      isValid: false,
      error: `Ngày kết thúc không được vượt quá ${maxDateStr}`,
    }
  }

  if (from > to) {
    return {
      isValid: false,
      error: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc',
    }
  }

  return { isValid: true }
}
