/**
 * Utility functions for validating Decimal(30,10) format
 * Decimal(30,10) means: 20 digits before decimal point, 10 digits after
 */

const MAX_INTEGER_DIGITS = 20 // 30 - 10 = 20 digits before decimal
const MAX_DECIMAL_DIGITS = 10 // 10 digits after decimal

/**
 * Validate if a number string matches Decimal(30,10) format
 * @param value - The value to validate (string or number)
 * @returns Error message if invalid, null if valid
 */
export function validateDecimal3010(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === '') {
    return null // Empty values are handled by required validation
  }

  const str = String(value).trim()
  if (str === '') {
    return null
  }

  // Check if it's a valid number
  const num = Number(str)
  if (!Number.isFinite(num)) {
    return 'Giá trị không phải là số hợp lệ'
  }

  if (num < 0) {
    return 'Giá trị không được âm'
  }

  // Split by decimal point
  const parts = str.split('.')
  const integerPart = parts[0] || ''
  const decimalPart = parts[1] || ''

  // Check integer part (before decimal point)
  if (integerPart.length > MAX_INTEGER_DIGITS) {
    return `Phần nguyên không được vượt quá ${MAX_INTEGER_DIGITS} chữ số`
  }

  // Check decimal part (after decimal point)
  if (decimalPart.length > MAX_DECIMAL_DIGITS) {
    return `Phần thập phân không được vượt quá ${MAX_DECIMAL_DIGITS} chữ số`
  }

  // Check total digits (should not exceed 30)
  const totalDigits = integerPart.length + decimalPart.length
  if (totalDigits > 30) {
    return 'Tổng số chữ số không được vượt quá 30'
  }

  return null
}

/**
 * Format a number to ensure it fits Decimal(30,10) format
 * This truncates excess decimal places but does not round
 * @param value - The number to format
 * @returns Formatted number string, or undefined if invalid
 */
export function formatDecimal3010(value: number | string | null | undefined): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined
  }

  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num) || num < 0) {
    return undefined
  }

  // Convert to string to check precision
  const str = String(num)
  const parts = str.split('.')
  const integerPart = parts[0] || ''
  const decimalPart = parts[1] || ''

  // If integer part is too long, return undefined (cannot format)
  if (integerPart.length > MAX_INTEGER_DIGITS) {
    return undefined
  }

  // Truncate decimal part if needed
  let finalDecimalPart = decimalPart
  if (finalDecimalPart.length > MAX_DECIMAL_DIGITS) {
    finalDecimalPart = finalDecimalPart.substring(0, MAX_DECIMAL_DIGITS)
  }

  // Reconstruct the number
  const formattedStr = finalDecimalPart ? `${integerPart}.${finalDecimalPart}` : integerPart

  return Number(formattedStr)
}
