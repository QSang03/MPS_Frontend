import { getWithDedupe } from '../internal-client'
import type { ApiListResponse, ListPagination } from '@/types/api'

export type CostCalculationHistoryItem = {
  id: string
  customerName?: string | null
  deviceLineName?: string | null
  createdByName?: string | null
  blackWhitePageCost?: number | null
  colorPageCost?: number | null
  materials?: Array<{
    partNumber?: string
    purchasePrice?: number
    capacity?: number
    materialType?: string
    [key: string]: unknown
  }> | null
  calculationDetails?: {
    bwCost?: number
    otherMaterialsCost?: number
    allMaterialsCost?: number
    [key: string]: unknown
  } | null
  createdBy?: unknown
  createdAt?: string
  updatedAt?: string
  status?: string
  fileUrl?: string
  [key: string]: unknown
}

export type GetCostCalculationQuery = {
  lang?: string
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  customerName?: string
  deviceLineName?: string
  createdBy?: string
}

type ListResponse = ApiListResponse<CostCalculationHistoryItem> & {
  message?: string
  code?: string
  statusCode?: number
  error?: string
}

export type CreateCostCalculationDto = {
  file: File
  customerName?: string
  deviceLineName?: string
}

function getFilenameFromContentDisposition(value: string | null): string | undefined {
  if (!value) return undefined
  const starMatch = value.match(/filename\*=(?:UTF-8'')?([^;]+)/i)
  if (starMatch?.[1]) {
    const raw = starMatch[1].trim().replace(/^"|"$/g, '')
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }
  const match = value.match(/filename=([^;]+)/i)
  if (!match?.[1]) return undefined
  return match[1].trim().replace(/^"|"$/g, '')
}

export const costCalculationService = {
  async list(query?: GetCostCalculationQuery) {
    const resp = await getWithDedupe<ListResponse>('/api/cost-calculation', { params: query })
    const body = resp.data || { data: [], pagination: undefined }
    const data = Array.isArray(body.data) ? body.data : []
    const pagination: ListPagination | undefined =
      body.pagination ||
      (body as unknown as { meta?: ListPagination })?.meta ||
      (body as unknown as { pagination?: ListPagination })?.pagination
    return { data, pagination, success: body.success ?? true, message: body.message }
  },

  async create(dto: CreateCostCalculationDto) {
    const formData = new FormData()
    formData.append('file', dto.file)
    if (dto.customerName?.trim()) formData.append('customerName', dto.customerName.trim())
    if (dto.deviceLineName?.trim()) formData.append('deviceLineName', dto.deviceLineName.trim())

    const resp = await fetch('/api/cost-calculation', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })

    const data = await resp.json().catch(() => null)
    if (!resp.ok) {
      const message =
        (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
          ? data.message
          : undefined) ||
        (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
          ? data.error
          : undefined) ||
        'Failed to create cost calculation'
      throw new Error(message)
    }

    return data
  },

  async downloadTemplate() {
    const resp = await fetch('/api/cost-calculation/template', {
      method: 'GET',
      credentials: 'include',
    })

    if (!resp.ok) {
      const data = await resp.json().catch(() => null)
      const message =
        (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
          ? data.message
          : undefined) ||
        (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
          ? data.error
          : undefined) ||
        'Failed to download template'
      throw new Error(message)
    }

    const blob = await resp.blob()
    const filename =
      getFilenameFromContentDisposition(resp.headers.get('content-disposition')) ||
      'cost-calculation-template.xlsx'

    return { blob, filename }
  },
}
