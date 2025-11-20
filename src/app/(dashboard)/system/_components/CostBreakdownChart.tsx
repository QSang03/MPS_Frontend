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
  rental: '#3b82f6', // blue
  repair: '#f59e0b', // orange
  pageBW: '#8b5cf6', // purple
  pageColor: '#ec4899', // pink
}

const LABELS = {
  rental: 'Thuê thiết bị',
  repair: 'Sửa chữa',
  pageBW: 'Trang đen trắng',
  pageColor: 'Trang màu',
}

// Custom tooltip component (outside render to avoid recreation)
interface TooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
  }>
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length && payload[0]) {
    return (
      <div className="rounded-lg border bg-white p-3 shadow-lg">
        <p className="font-semibold text-gray-900">{payload[0].name}</p>
        <p className="text-sm text-gray-600">{`${payload[0].value.toFixed(2)}%`}</p>
      </div>
    )
  }
  return null
}

export function CostBreakdownChart({
  costBreakdown,
  isLoading,
  onViewDetails,
  onExport,
}: CostBreakdownChartProps) {
  if (isLoading || !costBreakdown) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Doanh thu
          </CardTitle>
          <CardDescription>Tỷ lệ phần trăm theo doanh thu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-80 items-center justify-center">
            <div className="h-48 w-48 animate-pulse rounded-full bg-gray-200" />
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

  // Custom label for pie slices
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-bold"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="flex h-full flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            Doanh thu
          </CardTitle>
          <CardDescription>Tỷ lệ phần trăm theo doanh thu trong tháng</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: string, entry: any) => (
                  <span className="text-sm text-gray-700">
                    {value} ({entry.payload?.value?.toFixed(1) ?? 0}%)
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Summary Stats */}
          <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <div
                  className="h-3 w-3 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-gray-600">{item.name}</p>
                  <p className="text-sm font-semibold text-gray-900">{item.value.toFixed(2)}%</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="border-t bg-gray-50/50 p-3">
          <div className="flex w-full gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={onViewDetails}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Chi tiết
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={onExport}>
              <FileDown className="mr-2 h-4 w-4" />
              Xuất báo cáo
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
