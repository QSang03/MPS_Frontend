/**
 * Dashboard Types - Customer Admin Dashboard
 * API Endpoints: /dashboard/admin/overview, /dashboard/devices/{id}, /dashboard/consumables
 */

// ============================================================================
// ADMIN OVERVIEW DASHBOARD
// ============================================================================

/**
 * KPI Statistics from Admin Overview API
 */
export interface AdminOverviewKPIs {
  // Customer Statistics
  totalCustomers: number
  activeCustomers: number
  inactiveCustomers: number

  // Device Statistics
  totalDevices: number
  activeDevices: number
  maintenanceDevices: number
  errorDevices: number
  offlineDevices: number

  // User Statistics
  totalUsers: number

  // Cost & Usage
  totalCost: number
  totalBWPages: number
  totalColorPages: number
  previousMonthTotalCost: number
  costChangePercent: number

  // Service Requests
  totalServiceRequests: number
  openServiceRequests: number
  inProgressServiceRequests: number
  resolvedServiceRequests: number
  closedServiceRequests: number

  // Contracts
  totalContracts: number
  activeContracts: number
  pendingContracts: number
  expiredContracts: number
  terminatedContracts: number

  // Alerts
  totalAlerts: number
  lowConsumableAlerts: number
  deviceErrorAlerts: number
  slaBreachAlerts: number
}

/**
 * Cost Breakdown by Category (in percentages)
 */
export interface CostBreakdown {
  rentalPercent: number
  repairPercent: number
  pageBWPercent: number
  pageColorPercent: number
  // Cost adjustments (original)
  costAdjustmentDebit?: number
  costAdjustmentCredit?: number
  costAdjustmentNet?: number
  totalCogsAfterAdjustment?: number
  grossProfitAfterAdjustment?: number
  // Converted values (if backend returns for admin/base currency)
  costAdjustmentDebitConverted?: number
  costAdjustmentCreditConverted?: number
  costAdjustmentNetConverted?: number
  totalCogsAfterAdjustmentConverted?: number
  grossProfitAfterAdjustmentConverted?: number
}

/**
 * Top Customer by Revenue
 */
export interface TopCustomer {
  customerId: string
  customerName: string
  totalRevenue: number // doanh thu
  totalCogs: number // chi phí
  grossProfit: number // lợi nhuận gộp
  // Converted values (only for System Admin context)
  totalRevenueConverted?: number
  totalCogsConverted?: number
  grossProfitConverted?: number
  // Currency information (only for System Admin context)
  currency?: import('@/types/models/currency').CurrencyDataDto | null
  baseCurrency?: import('@/types/models/currency').CurrencyDataDto | null
  exchangeRate?: number | null
  // Cost adjustments (original)
  costAdjustmentDebit?: number
  costAdjustmentCredit?: number
  costAdjustmentNet?: number
  totalCogsAfterAdjustment?: number
  grossProfitAfterAdjustment?: number
  // Cost adjustments (converted)
  costAdjustmentDebitConverted?: number
  costAdjustmentCreditConverted?: number
  costAdjustmentNetConverted?: number
  totalCogsAfterAdjustmentConverted?: number
  grossProfitAfterAdjustmentConverted?: number
}

/**
 * Monthly Time-Series Data
 * Thống kê theo tháng
 */
export interface MonthlySeries {
  // points may be omitted when backend returns empty object
  points?: Array<{
    month: string // Format: YYYY-MM
    revenueRental: number
    revenueRepair: number
    revenuePageBW: number
    revenuePageColor: number
    totalRevenue: number // doanh thu
    cogsConsumable: number
    cogsRepair: number
    totalCogs: number // chi phí
    grossProfit: number // lợi nhuận gộp
    // Cost adjustments (original)
    costAdjustmentDebit?: number
    costAdjustmentCredit?: number
    costAdjustmentNet?: number
    totalCogsAfterAdjustment?: number
    grossProfitAfterAdjustment?: number
    // Converted values (only for System Admin context)
    revenueRentalConverted?: number
    revenueRepairConverted?: number
    revenuePageBWConverted?: number
    revenuePageColorConverted?: number
    totalRevenueConverted?: number
    cogsConsumableConverted?: number
    cogsRepairConverted?: number
    totalCogsConverted?: number
    grossProfitConverted?: number
    costAdjustmentDebitConverted?: number
    costAdjustmentCreditConverted?: number
    costAdjustmentNetConverted?: number
    totalCogsAfterAdjustmentConverted?: number
    grossProfitAfterAdjustmentConverted?: number
    // Currency information (only for System Admin context)
    currency?: import('@/types/models/currency').CurrencyDataDto | null
    baseCurrency?: import('@/types/models/currency').CurrencyDataDto | null
    exchangeRate?: number | null
  }>
}

/**
 * Complete Admin Overview Dashboard Data
 */
export interface AdminOverviewData {
  month: string // Format: YYYY-MM
  kpis: AdminOverviewKPIs
  costBreakdown: CostBreakdown
  topCustomers: TopCustomer[]
  monthlySeries?: MonthlySeries
  customer?: {
    id?: string
    name?: string
    code?: string
    isActive?: boolean
    defaultCurrency?: import('@/types/models/currency').CurrencyDataDto | null
  }
  // Currency information (only for System Admin context)
  baseCurrency?: import('@/types/models/currency').CurrencyDataDto | null
  // Optional detailed alerts structure (for Admin Overview API)
  alerts?: {
    consumableWarnings?: {
      total: number
      severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
      items?: Array<{
        deviceId?: string
        deviceName?: string
        serialNumber?: string
        ipAddress?: string
        consumableTypeName?: string
        remainingPercentage?: number
        warningThresholdPercentage?: number
        lastUpdatedAt?: string
      }>
    }
    // New backend keys
    urgentServiceRequests?: {
      total: number
      severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
      items?: Array<{
        id?: string
        title?: string
        status?: string
        priority?: string
        customerName?: string
        createdAt?: string
      }>
    }
    slaBreaches?: {
      total: number
      severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE'
      items?: Array<{
        id?: string
        title?: string
        breachType?: string
        status?: string
        customerName?: string
        dueAt?: string
        actualAt?: string
        overdueHours?: number
      }>
    }
    // Legacy keys retained for backward compatibility
    deviceErrors?: {
      total: number
      severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE'
      items?: Array<{
        deviceId?: string
        deviceName?: string
        serialNumber?: string
        errorMessage?: string
        occurredAt?: string
        // Fields shared with urgentServiceRequests
        id?: string
        title?: string
        status?: string
        priority?: string
        customerName?: string
        createdAt?: string
      }>
    }
    slaViolations?: {
      total: number
      severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE'
      items?: Array<{
        id?: string
        title?: string
        status?: string
        priority?: string
        customerName?: string
        createdAt?: string
        // Fields shared with SLA breaches
        breachType?: string
        dueAt?: string
        actualAt?: string
        overdueHours?: number
      }>
    }
  }
  // Recent service requests and notifications for display on Recent Activity
  recentRequests?: Array<{
    id: string
    title: string
    status: string
    priority?: string
    type?: string
    createdAt?: string
    customer?: { id?: string; name?: string }
  }>
  recentNotifications?: Array<{
    id: string
    title: string
    message?: string
    createdAt?: string
  }>
}

/**
 * API Response Wrapper for Admin Overview
 */
export interface AdminOverviewResponse {
  success: boolean
  data: AdminOverviewData
  message?: string
  error?: string
  code?: string
  statusCode: number
}

// ============================================================================
// DEVICE DASHBOARD
// ============================================================================

/**
 * Consumable Replacement History Item
 */
export interface ConsumableHistory {
  id: string
  consumableId: string
  installedAt: string // ISO 8601 date string
  removedAt: string | null // ISO 8601 date string or null if still active
  isActive: boolean
  actualPagesPrinted: number
  consumable: {
    id?: string
    name?: string
    type?: string
    [key: string]: unknown // Flexible for additional consumable properties
  }
}

/**
 * Device Time-Series Data (cost, pages, etc.)
 */
export interface DeviceTimeSeries {
  [metricName: string]: Array<{
    date: string // ISO 8601 or YYYY-MM
    value: number
  }>
}

/**
 * Device Pages Statistics
 */
export interface DevicePages {
  totalPages?: number
  bwPages?: number
  colorPages?: number
  [key: string]: unknown // Flexible for additional page metrics
}

/**
 * Complete Device Dashboard Data
 */
export interface DeviceDashboardData {
  series: DeviceTimeSeries
  pages: DevicePages
  consumableHistory: ConsumableHistory[]
  // Cost adjustments summary for device dashboard (optional)
  costAdjustmentDebit?: number
  costAdjustmentCredit?: number
  costAdjustmentNet?: number
  totalCogsAfterAdjustment?: number
  grossProfitAfterAdjustment?: number
  costAdjustmentDebitConverted?: number
  costAdjustmentCreditConverted?: number
  costAdjustmentNetConverted?: number
  totalCogsAfterAdjustmentConverted?: number
  grossProfitAfterAdjustmentConverted?: number
}

// ============================================================================
// DEVICE USAGE HISTORY
// ============================================================================

export interface DeviceConsumableUsagePoint {
  date: string // YYYY-MM-DD
  recordedAt?: string
  percentage?: number | null
  remaining?: number | null
  capacity?: number | null
  status?: string
  deviceConsumableId?: string
  consumableId?: string
  consumableSerialNumber?: string
}

export interface DeviceConsumableSeries {
  deviceConsumableId?: string
  consumableId?: string
  consumableSerialNumber?: string
  installedAt?: string
  removedAt?: string | null
  dataPoints?: DeviceConsumableUsagePoint[]
}

export interface DeviceConsumableTypeUsage {
  consumableTypeId?: string
  consumableTypeName?: string
  unit?: string
  description?: string
  series?: DeviceConsumableSeries[]
}

export interface DeviceUsageHistoryData {
  deviceId: string
  deviceModelId?: string
  fromDate: string
  toDate: string
  consumables: DeviceConsumableTypeUsage[]
}

export interface DeviceUsageHistoryResponse {
  success: boolean
  data: DeviceUsageHistoryData
  message?: string
  error?: string
  code?: string
  statusCode: number
}

/**
 * Device Dashboard Query Parameters
 */
export interface DeviceDashboardParams {
  deviceId: string
  customerId: string
  from: string // Format: YYYY-MM
  to: string // Format: YYYY-MM
}

/**
 * API Response Wrapper for Device Dashboard
 */
export interface DeviceDashboardResponse {
  success: boolean
  data: DeviceDashboardData
  message?: string
  error?: string
  code?: string
  statusCode: number
}

// ============================================================================
// CONSUMABLES DASHBOARD
// ============================================================================

/**
 * Consumables Dashboard Query Parameters
 */
export interface ConsumableDashboardParams {
  customerId: string
  from: string // Format: YYYY-MM
  to: string // Format: YYYY-MM
  consumableTypeId?: string // Optional filter
  deviceModelId?: string // Optional filter
}

/**
 * Consumables Dashboard Data
 * Note: Structure depends on actual API response
 */
export interface ConsumableDashboardData {
  summary?: {
    totalConsumables?: number
    activeConsumables?: number
    replacedConsumables?: number
    [key: string]: unknown
  }
  byType?: Array<{
    typeId: string
    typeName: string
    count: number
    totalCost?: number
  }>
  byDeviceModel?: Array<{
    modelId: string
    modelName: string
    count: number
    totalCost?: number
  }>
  timeline?: Array<{
    month: string
    count: number
    cost?: number
  }>
  [key: string]: unknown // Flexible for API evolution
}

/**
 * API Response Wrapper for Consumables Dashboard
 */
export interface ConsumableDashboardResponse {
  success: boolean
  data: ConsumableDashboardData
  message?: string
  error?: string
  code?: string
  statusCode: number
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Dashboard Date Range
 */
export interface DashboardDateRange {
  from: string // Format: YYYY-MM
  to: string // Format: YYYY-MM
}

/**
 * KPI Card Data Structure for UI
 */
export interface KPICardData {
  id: string
  title: string
  value: number | string
  change?: number // Percentage change
  trend?: 'up' | 'down' | 'neutral'
  subtitle?: string
  icon?: string
  color?: string
}

/**
 * Chart Data Point
 */
export interface ChartDataPoint {
  label: string
  value: number
  color?: string
  percentage?: number
}

/**
 * Alert Summary Item
 */
export interface AlertSummaryItem {
  type: 'low_consumable' | 'device_error' | 'sla_breach'
  count: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  label: string
  icon?: string
  color?: string
}
