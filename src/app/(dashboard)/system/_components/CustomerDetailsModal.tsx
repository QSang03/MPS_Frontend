'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Building2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Printer,
  FileText,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react'
import type { TopCustomer } from '@/types/dashboard'
import { cn } from '@/lib/utils/cn'
import internalApiClient from '@/lib/api/internal-client'

interface CustomerDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  month: string
}

interface CustomerOverview {
  month: string
  customerId: string
  kpis: {
    totalCost: number
    totalBWPages: number
    totalColorPages: number
    previousMonthTotalCost?: number
    costChangePercent?: number
  }
  costBreakdown: {
    rentalPercent: number
    repairPercent: number
    pageBWPercent: number
    pageColorPercent: number
  }
  topDevices?: Array<{
    deviceId: string
    rentalCost: number
    repairCost: number
    pageCostBW: number
    pageCostColor: number
    totalCost: number
  }>
  consumableAlerts?: Array<{
    id: string
    type: string
    title: string
    message: string
    createdAt: string
  }>
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function CustomerDetailsModal({ open, onOpenChange, month }: CustomerDetailsModalProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  // Fetch top customers when modal is opened. Use React Query to manage cache.
  const { data: topCustomers } = useQuery({
    queryKey: ['reports', 'top-customers', month],
    queryFn: async () => {
      const resp = await internalApiClient.get('/api/reports/costs/top-customers', {
        params: { page: 1, limit: 20, month },
      })
      return (resp.data?.data as TopCustomer[]) || []
    },
    enabled: !!open,
  })
  const { data: customerDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['customer-overview', selectedCustomerId, month],
    queryFn: async () => {
      if (!selectedCustomerId) return null
      const response = await internalApiClient.get<{ data: CustomerOverview }>(
        '/api/dashboard/overview',
        {
          params: { customerId: selectedCustomerId, month },
        }
      )
      return response.data.data
    },
    enabled: !!selectedCustomerId && open,
  })

  const handleBack = () => {
    setSelectedCustomerId(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SystemModalLayout
        title="Top khách hàng"
        description={`Danh sách ${(topCustomers ?? []).length} khách hàng chi tiêu cao nhất trong tháng ${month}`}
        icon={Building2}
        variant="view"
        maxWidth="!max-w-[80vw]"
        className="!max-h-[85vh]"
      >
        <AnimatePresence mode="wait">
          {!selectedCustomerId ? (
            // Customer List View
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mt-6 space-y-3">
                {(topCustomers ?? []).map((customer, index) => {
                  const totalRevenue = (topCustomers ?? []).reduce(
                    (sum, c) => sum + c.totalRevenue,
                    0
                  )
                  const percentage =
                    totalRevenue > 0 ? (customer.totalRevenue / totalRevenue) * 100 : 0

                  return (
                    <motion.div
                      key={customer.customerId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedCustomerId(customer.customerId)}
                      className={cn(
                        'group cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-lg',
                        index < 3 && 'border-2',
                        index === 0 && 'border-yellow-300 bg-yellow-50/70 hover:bg-yellow-50',
                        index === 1 && 'border-gray-300 bg-gray-50/70 hover:bg-gray-50',
                        index === 2 && 'border-orange-300 bg-orange-50/70 hover:bg-orange-50',
                        index >= 3 && 'border-gray-200 hover:border-cyan-300 hover:bg-cyan-50/30'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-lg font-bold text-white">
                          #{index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900">{customer.customerName}</p>
                            {index < 3 && (
                              <Badge
                                className={cn(
                                  index === 0 && 'bg-yellow-500',
                                  index === 1 && 'bg-gray-400',
                                  index === 2 && 'bg-orange-500'
                                )}
                              >
                                Top {index + 1}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">ID: {customer.customerId}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(customer.totalRevenue)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Chi phí: {formatCurrency(customer.totalCogs)}
                          </p>
                          <p
                            className={cn(
                              'text-xs font-semibold',
                              customer.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'
                            )}
                          >
                            Lợi nhuận: {formatCurrency(customer.grossProfit)}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {percentage.toFixed(1)}% tổng doanh thu
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          ) : (
            // Customer Details View
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={handleBack}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h3 className="text-2xl font-bold">Chi tiết khách hàng</h3>
                    <p className="text-sm text-gray-600">
                      {
                        (topCustomers ?? []).find((c) => c.customerId === selectedCustomerId)
                          ?.customerName
                      }
                    </p>
                  </div>
                </div>
              </div>

              {isLoadingDetails ? (
                <div className="mt-6 space-y-4">
                  <Skeleton className="h-32 w-full rounded-2xl" />
                  <Skeleton className="h-32 w-full rounded-2xl" />
                  <Skeleton className="h-32 w-full rounded-2xl" />
                </div>
              ) : customerDetails ? (
                <div className="mt-6 space-y-6">
                  {/* KPIs */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4" />
                          Tổng chi phí
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {formatCurrency(customerDetails.kpis.totalCost)}
                        </p>
                        {customerDetails.kpis.costChangePercent !== undefined &&
                        customerDetails.kpis.costChangePercent !== null &&
                        !isNaN(customerDetails.kpis.costChangePercent) ? (
                          <div
                            className={cn(
                              'mt-1 flex items-center gap-1 text-sm',
                              customerDetails.kpis.costChangePercent > 0
                                ? 'text-red-600'
                                : 'text-green-600'
                            )}
                          >
                            {customerDetails.kpis.costChangePercent > 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            {Math.abs(customerDetails.kpis.costChangePercent).toFixed(1)}% so với
                            tháng trước
                          </div>
                        ) : (
                          <p className="mt-1 text-xs text-gray-500">
                            Chưa có dữ liệu tháng trước để so sánh
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4" />
                          Tổng số trang in
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {formatNumber(
                            customerDetails.kpis.totalBWPages + customerDetails.kpis.totalColorPages
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatNumber(customerDetails.kpis.totalBWPages)} BW •{' '}
                          {formatNumber(customerDetails.kpis.totalColorPages)} Màu
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Cost Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Phân tích chi phí</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="mb-1 flex justify-between text-sm">
                            <span>Thuê máy</span>
                            <span className="font-semibold">
                              {customerDetails.costBreakdown.rentalPercent.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${customerDetails.costBreakdown.rentalPercent}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 flex justify-between text-sm">
                            <span>Sửa chữa</span>
                            <span className="font-semibold">
                              {customerDetails.costBreakdown.repairPercent.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full bg-orange-500"
                              style={{ width: `${customerDetails.costBreakdown.repairPercent}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 flex justify-between text-sm">
                            <span>In đen trắng</span>
                            <span className="font-semibold">
                              {customerDetails.costBreakdown.pageBWPercent.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full bg-gray-600"
                              style={{ width: `${customerDetails.costBreakdown.pageBWPercent}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 flex justify-between text-sm">
                            <span>In màu</span>
                            <span className="font-semibold">
                              {customerDetails.costBreakdown.pageColorPercent.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full bg-purple-500"
                              style={{
                                width: `${customerDetails.costBreakdown.pageColorPercent}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Devices */}
                  {customerDetails.topDevices && customerDetails.topDevices.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Printer className="h-4 w-4" />
                          Thiết bị chi phí cao nhất
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {customerDetails.topDevices.map((device, idx) => (
                            <div
                              key={device.deviceId}
                              className="flex items-center justify-between rounded border p-2"
                            >
                              <div>
                                <p className="text-sm font-medium">Thiết bị #{idx + 1}</p>
                                <p className="text-xs text-gray-500">{device.deviceId}</p>
                              </div>
                              <p className="font-bold">{formatCurrency(device.totalCost)}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Consumable Alerts */}
                  {customerDetails.consumableAlerts &&
                    customerDetails.consumableAlerts.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            Cảnh báo vật tư ({customerDetails.consumableAlerts.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {customerDetails.consumableAlerts.map((alert) => (
                              <div
                                key={alert.id}
                                className="rounded border-l-4 border-orange-500 bg-orange-50 p-3"
                              >
                                <p className="text-sm font-semibold">{alert.title}</p>
                                <p className="text-xs text-gray-600">{alert.message}</p>
                                <p className="mt-1 text-xs text-gray-500">
                                  {new Date(alert.createdAt).toLocaleString('vi-VN')}
                                </p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                </div>
              ) : (
                <div className="mt-6 text-center text-gray-500">
                  <p>Không thể tải thông tin chi tiết</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </SystemModalLayout>
    </Dialog>
  )
}
