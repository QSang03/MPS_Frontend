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
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { CostBreakdown } from '@/types/dashboard'
import { DollarSign, FileDown, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CostBreakdownChartProps {
  costBreakdown: CostBreakdown | undefined
  isLoading?: boolean
  onViewDetails?: () => void
  onExport?: () => void
}

const COLORS = {
  rental: '#0066CC', // Primary Blue
  repair: '#F59E0B', // Warning Orange
  pageBW: '#64748B', // Slate
  pageColor: '#10B981', // Success Green
}

const LABELS = {
  rental: 'Thuê thiết bị',
  repair: 'Sửa chữa',
  pageBW: 'Trang đen trắng',
  pageColor: 'Trang màu',
}

export function CostBreakdownChart({
  costBreakdown,
  isLoading,
  onViewDetails,
  onExport,
}: CostBreakdownChartProps) {
  if (isLoading || !costBreakdown) {
    return (
      <Card className="border-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#1F2937]">
            <DollarSign className="h-5 w-5 text-[#0066CC]" />
            Doanh thu
          </CardTitle>
          <CardDescription className="text-[13px] text-[#6B7280]">
            Tỷ lệ phần trăm theo doanh thu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-80 items-center justify-center">
            <div className="h-48 w-48 animate-pulse rounded-full bg-gray-100" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = [
    {
      name: LABELS.rental,
      value: costBreakdown.rentalPercent,
      color: COLORS.rental,
    },
    {
      name: LABELS.repair,
      value: costBreakdown.repairPercent,
      color: COLORS.repair,
    },
    {
      name: LABELS.pageBW,
      value: costBreakdown.pageBWPercent,
      color: COLORS.pageBW,
    },
    {
      name: LABELS.pageColor,
      value: costBreakdown.pageColorPercent,
      color: COLORS.pageColor,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="flex h-full flex-col border-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#1F2937]">
            <DollarSign className="h-5 w-5 text-[#0066CC]" />
            Doanh thu
          </CardTitle>
          <CardDescription className="text-[13px] text-[#6B7280]">
            Tỷ lệ phần trăm theo doanh thu trong tháng
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
                itemStyle={{ color: '#fff', fontSize: '13px' }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Tỷ lệ']}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  fontSize: '13px',
                  color: '#6B7280',
                  paddingTop: '20px',
                }}
                formatter={(value: string) => <span className="ml-1 text-[#6B7280]">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Summary Stats */}
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <div
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-[#6B7280]">{item.name}</p>
                  <p className="text-sm font-semibold text-[#1F2937]">{item.value.toFixed(2)}%</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="border-t border-gray-100 bg-gray-50/50 p-3">
          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-gray-200 text-[#6B7280] hover:bg-white hover:text-[#1F2937]"
              onClick={onViewDetails}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Chi tiết
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-gray-200 text-[#6B7280] hover:bg-white hover:text-[#1F2937]"
              onClick={onExport}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Xuất báo cáo
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
