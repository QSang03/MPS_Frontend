/**
 * System Settings Types
 * Defines types and interfaces for system settings management
 */

/**
 * System setting types
 */
export enum SystemSettingType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
  SECRET = 'SECRET',
}

/**
 * Base System Setting interface
 */
export interface SystemSetting {
  id: string
  key: string
  value: string
  description: string
  type: SystemSettingType
  isEditable: boolean
  createdAt: string
  updatedAt: string
}

/**
 * System Setting list query parameters
 */
export interface SystemSettingQuery {
  page?: number
  limit?: number
  key?: string
  type?: SystemSettingType
  isEditable?: boolean
}

/**
 * System Setting create/update data
 */
export interface SystemSettingFormData {
  value: string
  description?: string
}

/**
 * System Setting API response
 */
export interface SystemSettingResponse {
  success: boolean
  data: SystemSetting
  message: string
  error?: string
  code?: string
  statusCode: number
}

/**
 * System Settings list API response
 */
export interface SystemSettingsResponse {
  success: boolean
  data: SystemSetting[]
  message: string
  error?: string
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
