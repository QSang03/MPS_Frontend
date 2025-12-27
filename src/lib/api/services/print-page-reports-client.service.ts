import internalApiClient from '../internal-client'
import { buildProxiedSignedUrl } from '@/lib/utils/signed-url'
import type {
  PrintPageReport,
  PrintPageReportListItem,
  GeneratePrintPageReportDto,
  ExportPrintPageReportDto,
  PrintPageReportQueryParams,
} from '@/types/models/print-page-report'
import type { ApiListResponse, ListPagination } from '@/types/api'

export const printPageReportsClientService = {
  /**
   * Get all print page reports (client-side)
   * Calls Next.js API Route to avoid CORS issues
   */
  async getAll(params?: PrintPageReportQueryParams): Promise<{
    data: PrintPageReportListItem[]
    pagination?: ListPagination
  }> {
    const response = await internalApiClient.get<ApiListResponse<PrintPageReportListItem>>(
      '/api/reports/print-page',
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.sortBy ? { sortBy: params.sortBy } : {}),
          ...(params?.sortOrder ? { sortOrder: params.sortOrder } : {}),
          ...(params?.customerId ? { customerId: params.customerId } : {}),
          ...(params?.status ? { status: params.status } : {}),
          ...(params?.month ? { month: params.month } : {}),
          ...(params?.lang ? { lang: params.lang } : {}),
        },
      }
    )
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  /**
   * Get print page report by ID
   */
  async getById(id: string): Promise<PrintPageReport | null> {
    const response = await internalApiClient.get(`/api/reports/print-page/${id}`)
    return response.data?.data ?? response.data ?? null
  },

  /**
   * Generate new print page report
   * Use dryRun: true for preview mode
   */
  async generate(payload: GeneratePrintPageReportDto): Promise<PrintPageReport | null> {
    const response = await internalApiClient.post('/api/reports/print-page/generate', payload)
    return response.data?.data ?? response.data ?? null
  },

  /**
   * Export report to XLSX
   */
  async exportXlsx(payload: ExportPrintPageReportDto): Promise<{ xlsxUrl?: string } | null> {
    const response = await internalApiClient.post('/api/reports/print-page/export-xlsx', payload)

    // Backend responses vary:
    // - { success: true, data: { fileUrl: string } }
    // - { success: true, data: { xlsxUrl: string } }
    // - { success: true, data: { url: string } }
    // - or sometimes the URL itself
    const raw = response.data?.data ?? response.data

    if (!raw) return null

    const normalizeToDownloadUrl = (url: string): string => {
      const trimmed = url.trim()
      if (!trimmed) return ''

      // Already proxied/signed via Next.js
      if (trimmed.startsWith('/api/files/proxy')) return trimmed

      // Convert backend public uploads URL/path to a same-origin proxied signed URL
      // Examples:
      // - /public/uploads/excel/report.xlsx
      // - https://api.example.com/public/uploads/excel/report.xlsx
      const marker = '/public/uploads/'
      const idx = trimmed.indexOf(marker)
      if (idx >= 0) {
        const filePath = trimmed.slice(idx + marker.length)
        return buildProxiedSignedUrl(filePath)
      }

      // If backend returns just the path under uploads (e.g. excel/report.xlsx)
      if (!trimmed.startsWith('http') && !trimmed.startsWith('/')) {
        return buildProxiedSignedUrl(trimmed)
      }

      // Otherwise return as-is (might be a public URL)
      return trimmed
    }

    if (typeof raw === 'string') {
      const xlsxUrl = normalizeToDownloadUrl(raw)
      return xlsxUrl ? { xlsxUrl } : null
    }

    if (typeof raw === 'object') {
      const obj = raw as Record<string, unknown>
      const xlsxUrl =
        (typeof obj.xlsxUrl === 'string' && obj.xlsxUrl) ||
        (typeof obj.fileUrl === 'string' && obj.fileUrl) ||
        (typeof obj.url === 'string' && obj.url) ||
        (typeof obj.downloadUrl === 'string' && obj.downloadUrl) ||
        (typeof obj.signedUrl === 'string' && obj.signedUrl) ||
        (typeof obj.xlsxSignedUrl === 'string' && obj.xlsxSignedUrl) ||
        (typeof obj.xlsxDownloadUrl === 'string' && obj.xlsxDownloadUrl)

      const normalized = typeof xlsxUrl === 'string' ? normalizeToDownloadUrl(xlsxUrl) : ''
      return normalized ? { xlsxUrl: normalized } : null
    }

    return null
  },
}

export default printPageReportsClientService
