'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { TopCustomer } from '@/types/dashboard'
import { Building2, Crown, Medal, Award } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface TopCustomersTableProps {
  topCustomers: TopCustomer[] | undefined
  isLoading?: boolean
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount)
}

const RANK_ICONS = [
  { icon: Crown, color: 'text-yellow-500', bgColor: 'bg-yellow-50', label: '#1' },
  { icon: Medal, color: 'text-gray-400', bgColor: 'bg-gray-50', label: '#2' },
  { icon: Award, color: 'text-orange-500', bgColor: 'bg-orange-50', label: '#3' },
]

export function TopCustomersTable({ topCustomers, isLoading }: TopCustomersTableProps) {
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

  // Calculate total cost for percentage
  const totalCost = topCustomers.reduce((sum, customer) => sum + customer.totalCost, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-cyan-600" />
            Top khách hàng
          </CardTitle>
          <CardDescription>
            Khách hàng chi tiêu cao nhất trong tháng (Top {topCustomers.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topCustomers.map((customer, index) => {
              const percentage = totalCost > 0 ? (customer.totalCost / totalCost) * 100 : 0
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
                      rankConfig?.bgColor || 'bg-blue-50'
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
                          index >= 3 && 'bg-gradient-to-r from-blue-400 to-blue-600'
                        )}
                      />
                    </div>
                  </div>

                  {/* Cost & Percentage */}
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(customer.totalCost)}</p>
                    <p className="text-xs text-gray-500">{percentage.toFixed(1)}% tổng doanh thu</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Summary Footer */}
          {topCustomers.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-600">Tổng doanh thu:</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(totalCost)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
