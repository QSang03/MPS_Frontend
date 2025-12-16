import internalApiClient from '../internal-client'
import type {
  NavigationConfig,
  CreateNavigationConfigDto,
  UpdateNavigationConfigDto,
  NavigationConfigQuery,
  NavigationConfigResponse,
  NavigationConfigListResponse,
} from '@/types/navigation-config'
import type { NavActionPayload, NavItemPayload } from '@/constants/navigation'

// Remove locale-specific label/description fields before sending to backend
const stripLocaleFields = (items: NavItemPayload[] | undefined): NavItemPayload[] =>
  (items ?? []).map((item) => {
    const sanitizedItem: NavItemPayload & Record<string, unknown> = { ...item }
    delete sanitizedItem.labelEn
    delete sanitizedItem.labelVi
    delete sanitizedItem.descriptionEn
    delete sanitizedItem.descriptionVi

    sanitizedItem.actions = (item.actions ?? []).map((action) => {
      const sanitizedAction: NavActionPayload & Record<string, unknown> = { ...action }
      delete sanitizedAction.labelEn
      delete sanitizedAction.labelVi
      delete sanitizedAction.descriptionEn
      delete sanitizedAction.descriptionVi
      return sanitizedAction as NavActionPayload
    })

    return sanitizedItem as NavItemPayload
  })

const sanitizeNavigationPayload = <T extends { config?: { items?: NavItemPayload[] } }>(
  payload: T
): T => {
  if (!payload?.config?.items) return payload
  return {
    ...payload,
    config: {
      ...payload.config,
      items: stripLocaleFields(payload.config.items),
    },
  }
}

export const navigationConfigService = {
  /**
   * Get all navigation configs (client-side)
   * Gọi Next.js API Route thay vì gọi trực tiếp backend để tránh CORS
   */
  async getAll(params?: NavigationConfigQuery): Promise<{
    data: NavigationConfig[]
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }> {
    const response = await internalApiClient.get<NavigationConfigListResponse>(
      '/api/navigation-config',
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.sortBy ? { sortBy: params.sortBy } : {}),
          ...(params?.sortOrder ? { sortOrder: params.sortOrder } : {}),
          ...(params?.isActive !== undefined ? { isActive: params.isActive } : {}),
          ...(params?.customerId !== undefined ? { customerId: params.customerId } : {}),
          ...(params?.roleId !== undefined ? { roleId: params.roleId } : {}),
        },
      }
    )
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  /**
   * Get navigation config by ID
   */
  async getById(id: string): Promise<NavigationConfig | null> {
    const response = await internalApiClient.get<NavigationConfigResponse>(
      `/api/navigation-config/${id}`
    )
    return response.data?.data ?? null
  },

  /**
   * Get navigation config by name
   */
  async getByName(name: string): Promise<NavigationConfig | null> {
    const response = await internalApiClient.get<NavigationConfigResponse>(
      `/api/navigation-config/name/${encodeURIComponent(name)}`
    )
    return response.data?.data ?? null
  },

  /**
   * Create new navigation config
   */
  async create(payload: CreateNavigationConfigDto): Promise<NavigationConfig | null> {
    const sanitizedPayload = sanitizeNavigationPayload(payload)
    const response = await internalApiClient.post<NavigationConfigResponse>(
      '/api/navigation-config',
      sanitizedPayload,
      { timeout: 600_000 } // allow long-running creation (up to 600s)
    )
    return response.data?.data ?? null
  },

  /**
   * Update navigation config
   */
  async update(id: string, payload: UpdateNavigationConfigDto): Promise<NavigationConfig | null> {
    const sanitizedPayload = sanitizeNavigationPayload(payload)
    const response = await internalApiClient.patch<NavigationConfigResponse>(
      `/api/navigation-config/${id}`,
      sanitizedPayload,
      { timeout: 600_000 } // allow long-running update (up to 600s)
    )
    return response.data?.data ?? null
  },

  /**
   * Delete navigation config
   */
  async delete(id: string): Promise<boolean> {
    const response = await internalApiClient.delete(`/api/navigation-config/${id}`)
    return response.status === 200 || response.data?.success === true
  },
}
