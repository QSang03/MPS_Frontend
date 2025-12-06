'use client'

import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { TopCustomer } from '@/types/dashboard'
import { Building2, Crown, Medal, Award, Users, Download } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { CurrencyDataDto } from '@/types/models/currency'
import { formatCurrencyWithSymbol } from '@/lib/utils/formatters'

interface TopCustomersTableProps {
  topCustomers: TopCustomer[] | undefined
  isLoading?: boolean
  onViewAll?: () => void
  onExport?: () => void
  baseCurrency?: CurrencyDataDto | null
}

function formatCurrency(amount: number, currency?: CurrencyDataDto | null): string {
  if (currency) {
    return formatCurrencyWithSymbol(amount, currency)
  }
  // Fallback to USD if no currency provided
  return formatCurrencyWithSymbol(amount, { code: 'USD', symbol: '$' } as CurrencyDataDto)
}

const RANK_ICONS = [
  { icon: Crown, color: 'text-yellow-500', bgColor: 'bg-yellow-50', label: '#1' },
  { icon: Medal, color: 'text-gray-400', bgColor: 'bg-gray-50', label: '#2' },
  { icon: Award, color: 'text-orange-500', bgColor: 'bg-orange-50', label: '#3' },
]

export function TopCustomersTable({
  topCustomers,
  isLoading,
  onViewAll,
  onExport,
  baseCurrency,
}: TopCustomersTableProps) {
  if (isLoading || !topCustomers) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Top khách hàng
          </CardTitle>
          <CardDescription>Khách hàng chi tiêu cao nhất trong tháng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (topCustomers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Top khách hàng
          </CardTitle>
          <CardDescription>Khách hàng chi tiêu cao nhất trong tháng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center text-gray-500">
            <div className="text-center">
              <Building2 className="mx-auto mb-2 h-12 w-12 text-gray-300" />
              <p>Chưa có dữ liệu khách hàng</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Helper to get display value (converted if available, else original)
  const getDisplayValue = (
    original: number,
    converted: number | undefined,
    useConverted: boolean
  ): number => {
    if (useConverted && converted !== undefined) return converted
    return original
  }

  // Use converted values if baseCurrency is available (System Admin context)
  const useConverted = !!baseCurrency

  // Calculate total revenue for percentage (use converted if available)
  const totalRevenue = topCustomers.reduce(
    (sum, customer) =>
      sum + getDisplayValue(customer.totalRevenue, customer.totalRevenueConverted, useConverted),
    0
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="border-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
            <Building2 className="h-5 w-5 text-[#0066CC]" />
            Top khách hàng
          </CardTitle>
          <CardDescription className="text-[13px] text-[#6B7280]">
            Khách hàng chi tiêu cao nhất trong tháng (Top {topCustomers.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topCustomers.map((customer, index) => {
              const revenue = getDisplayValue(
                customer.totalRevenue,
                customer.totalRevenueConverted,
                useConverted
              )
              const cogs = getDisplayValue(
                customer.totalCogs,
                customer.totalCogsConverted,
                useConverted
              )
              const profit = getDisplayValue(
                customer.grossProfit,
                customer.grossProfitConverted,
                useConverted
              )
              const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0
              const rankConfig = RANK_ICONS[index]

              return (
                <motion.div
                  key={customer.customerId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className={cn(
                    'group flex items-center gap-4 rounded-lg border p-3 transition-all hover:shadow-md',
                    index < 3 && 'border-2',
                    index === 0 && 'border-yellow-200 bg-yellow-50/50',
                    index === 1 && 'border-gray-200 bg-gray-50/50',
                    index === 2 && 'border-orange-200 bg-orange-50/50'
                  )}
                >
                  {/* Rank Icon/Number */}
                  <div
                    className={cn(
                      'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full',
                      rankConfig?.bgColor || 'bg-[var(--brand-50)]'
                    )}
                  >
                    {rankConfig ? (
                      <rankConfig.icon className={cn('h-6 w-6', rankConfig.color)} />
                    ) : (
                      <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-gray-900">
                        {customer.customerName}
                      </p>
                      {index < 3 && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            'flex-shrink-0',
                            index === 0 && 'bg-yellow-100 text-yellow-700',
                            index === 1 && 'bg-gray-100 text-gray-700',
                            index === 2 && 'bg-orange-100 text-orange-700'
                          )}
                        >
                          Top {index + 1}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">ID: {customer.customerId}</p>

                    {/* Progress Bar */}
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                        className={cn(
                          'h-full',
                          index === 0 && 'bg-gradient-to-r from-yellow-400 to-yellow-600',
                          index === 1 && 'bg-gradient-to-r from-gray-400 to-gray-600',
                          index === 2 && 'bg-gradient-to-r from-orange-400 to-orange-600',
                          index >= 3 &&
                            'bg-gradient-to-r from-[var(--brand-400)] to-[var(--brand-600)]'
                        )}
                      />
                    </div>
                  </div>

                  {/* Revenue, COGS, Profit & Percentage */}
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatCurrency(revenue, baseCurrency || customer.baseCurrency)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Chi phí: {formatCurrency(cogs, baseCurrency || customer.baseCurrency)}
                    </p>
                    <p
                      className={cn(
                        'text-xs font-semibold',
                        profit >= 0 ? 'text-[var(--color-success-600)]' : 'text-[var(--error-600)]'
                      )}
                    >
                      Lợi nhuận: {formatCurrency(profit, baseCurrency || customer.baseCurrency)}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {percentage.toFixed(1)}% tổng doanh thu
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Summary Footer */}
          {topCustomers.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-600">Tổng doanh thu:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(totalRevenue, baseCurrency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-600">Tổng chi phí:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(
                      topCustomers.reduce(
                        (sum, customer) =>
                          sum +
                          getDisplayValue(
                            customer.totalCogs,
                            customer.totalCogsConverted,
                            useConverted
                          ),
                        0
                      ),
                      baseCurrency
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-600">Tổng lợi nhuận gộp:</span>
                  <span
                    className={cn(
                      'text-lg font-bold',
                      topCustomers.reduce(
                        (sum, customer) =>
                          sum +
                          getDisplayValue(
                            customer.grossProfit,
                            customer.grossProfitConverted,
                            useConverted
                          ),
                        0
                      ) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    )}
                  >
                    {formatCurrency(
                      topCustomers.reduce(
                        (sum, customer) =>
                          sum +
                          getDisplayValue(
                            customer.grossProfit,
                            customer.grossProfitConverted,
                            useConverted
                          ),
                        0
                      ),
                      baseCurrency
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50/50 p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="gap-2 border-gray-200 text-[#6B7280] hover:bg-white hover:text-[var(--brand-700)]"
          >
            <Download className="h-4 w-4" />
            Xuất danh sách
          </Button>
          <Button
            size="sm"
            onClick={onViewAll}
            className="gap-2 bg-[var(--btn-primary)] hover:bg-[var(--btn-primary-hover)]"
          >
            <Users className="h-4 w-4" />
            Xem tất cả
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
