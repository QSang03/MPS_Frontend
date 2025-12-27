/**
 * Print Page Report model
 */
export interface PrintPageReport {
  id: string
  reportNumber: string
  customerId: string
  customerName: string
  customerAddress?: string
  periodStart: string
  periodEnd: string
  periodLabel?: string
  billingDay?: number
  totalBwPagesA4: number
  totalColorPagesA4: number
  status: PrintPageReportStatus
  xlsxUrl?: string
  generatedDate?: string
  createdAt: string
  notes?: string
  lineItems?: PrintPageReportLineItem[]
}

/**
 * Print Page Report status enum
 */
export type PrintPageReportStatus = 'DRAFT' | 'GENERATED' | 'VOID'

/**
 * Print Page Report line item (device counter details)
 */
export interface PrintPageReportLineItem {
  stt: number
  deviceId: string
  deviceModel: string
  serialNumber: string
  location: string
  bwOldA4: number
  bwNewA4: number
  bwUsedA4: number
  colorOldA4: number
  colorNewA4: number
  colorUsedA4: number
}

/**
 * Print Page Report list item (simplified for list view)
 */
export interface PrintPageReportListItem {
  id: string
  reportNumber: string
  customerId: string
  customerName: string
  periodStart: string
  periodEnd: string
  totalBwPagesA4: number
  totalColorPagesA4: number
  status: PrintPageReportStatus
  xlsxUrl?: string
  generatedDate?: string
  createdAt: string
}

/**
 * Generate Print Page Report DTO
 */
export interface GeneratePrintPageReportDto {
  customerId: string
  billingDate: string
  periodStartOverride?: string
  periodEndOverride?: string
  notes?: string
  dryRun?: boolean
  forceRegenerate?: boolean
}

/**
 * Export to XLSX DTO
 */
export interface ExportPrintPageReportDto {
  reportId: string
  customerId: string
}

/**
 * Void (cancel) print page report DTO
 */
export interface VoidPrintPageReportDto {
  reportId: string
  notes?: string
}

/**
 * Query params for listing print page reports
 */
export interface PrintPageReportQueryParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  customerId?: string
  status?: PrintPageReportStatus
  month?: string
  lang?: 'vi' | 'en'
}
