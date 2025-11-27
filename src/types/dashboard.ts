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
}

/**
 * Monthly Time-Series Data
 * Thống kê theo tháng
 */
export interface MonthlySeries {
  points: Array<{
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
  monthlySeries: MonthlySeries
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any // Flexible for additional consumable properties
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any // Flexible for additional page metrics
}

/**
 * Complete Device Dashboard Data
 */
export interface DeviceDashboardData {
  series: DeviceTimeSeries
  pages: DevicePages
  consumableHistory: ConsumableHistory[]
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any // Flexible for API evolution
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
