import internalApiClient from '../internal-client'
import { buildProxiedSignedUrl } from '@/lib/utils/signed-url'
import type {
  PrintPageReport,
  PrintPageReportListItem,
  GeneratePrintPageReportDto,
  ExportPrintPageReportDto,
  PrintPageReportQueryParams,
  VoidPrintPageReportDto,
} from '@/types/models/print-page-report'
import type { ApiListResponse, ListPagination } from '@/types/api'

const normalizeToDownloadUrl = (url: string): string => {
  const trimmed = url.trim()
  if (!trimmed) return ''

  // Already proxied/signed via Next.js
  if (trimmed.startsWith('/api/files/proxy')) return trimmed

  // Convert backend public uploads URL/path to a same-origin proxied signed URL
  // Examples:
  // - /public/uploads/pdf/report.pdf
  // - https://api.example.com/public/uploads/pdf/report.pdf
  const marker = '/public/uploads/'
  const idx = trimmed.indexOf(marker)
  if (idx >= 0) {
    const filePath = trimmed.slice(idx + marker.length)
    return buildProxiedSignedUrl(filePath)
  }

  // If backend returns just the path under uploads (e.g. pdf/report.pdf)
  if (!trimmed.startsWith('http') && !trimmed.startsWith('/')) {
    return buildProxiedSignedUrl(trimmed)
  }

  // Otherwise return as-is (might be a public URL)
  return trimmed
}

const normalizeReportFileUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const normalized = normalizeToDownloadUrl(value)
  return normalized || undefined
}

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
    const list = Array.isArray(data) ? data : []
    const normalized = list.map((item) => ({
      ...item,
      xlsxUrl: normalizeReportFileUrl((item as unknown as { xlsxUrl?: unknown })?.xlsxUrl),
      pdfUrl: normalizeReportFileUrl((item as unknown as { pdfUrl?: unknown })?.pdfUrl),
    }))
    return { data: normalized, pagination }
  },

  /**
   * Get print page report by ID
   */
  async getById(id: string): Promise<PrintPageReport | null> {
    const response = await internalApiClient.get(`/api/reports/print-page/${id}`)
    const raw = (response.data?.data ?? response.data ?? null) as PrintPageReport | null
    if (!raw) return null
    return {
      ...raw,
      xlsxUrl: normalizeReportFileUrl((raw as unknown as { xlsxUrl?: unknown })?.xlsxUrl),
      pdfUrl: normalizeReportFileUrl((raw as unknown as { pdfUrl?: unknown })?.pdfUrl),
    }
  },

  /**
   * Generate new print page report
   * Use dryRun: true for preview mode
   */
  async generate(payload: GeneratePrintPageReportDto): Promise<PrintPageReport | null> {
    const response = await internalApiClient.post('/api/reports/print-page/generate', payload)
    const raw = (response.data?.data ?? response.data ?? null) as PrintPageReport | null
    if (!raw) return null
    return {
      ...raw,
      xlsxUrl: normalizeReportFileUrl((raw as unknown as { xlsxUrl?: unknown })?.xlsxUrl),
      pdfUrl: normalizeReportFileUrl((raw as unknown as { pdfUrl?: unknown })?.pdfUrl),
    }
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

  /**
   * Void (cancel) a print page report
   * Changes status to VOID
   */
  async voidReport(payload: VoidPrintPageReportDto): Promise<boolean> {
    try {
      const response = await internalApiClient.post('/api/reports/print-page/void', payload)
      return response.data?.success === true
    } catch {
      return false
    }
  },
}

export default printPageReportsClientService
