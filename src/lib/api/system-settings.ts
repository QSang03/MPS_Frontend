/**
 * System Settings API Client
 * Handles all API calls related to system settings management
 */

import internalApiClient from './internal-client'
import type {
  SystemSettingQuery,
  SystemSettingFormData,
  SystemSettingResponse,
  SystemSettingsResponse,
} from '@/types/system-settings'

const BASE_URL = '/api/system-settings'

/**
 * Get all system settings with optional filters
 */
export async function getSystemSettings(
  params?: SystemSettingQuery
): Promise<SystemSettingsResponse> {
  const { data } = await internalApiClient.get<SystemSettingsResponse>(BASE_URL, { params })
  return data
}

/**
 * Get system setting by ID
 */
export async function getSystemSettingById(id: string): Promise<SystemSettingResponse> {
  const { data } = await internalApiClient.get<SystemSettingResponse>(`${BASE_URL}/${id}`)
  return data
}

/**
 * Get system setting by key
 */
export async function getSystemSettingByKey(key: string): Promise<SystemSettingResponse> {
  const { data } = await internalApiClient.get<SystemSettingResponse>(`${BASE_URL}/key/${key}`)
  return data
}

/**
 * Update system setting
 */
export async function updateSystemSetting(
  id: string,
  formData: SystemSettingFormData
): Promise<SystemSettingResponse> {
  const { data } = await internalApiClient.patch<SystemSettingResponse>(
    `${BASE_URL}/${id}`,
    formData
  )
  return data
}
