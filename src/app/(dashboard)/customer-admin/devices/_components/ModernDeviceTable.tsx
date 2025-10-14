'use client'

import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Printer,
  MoreHorizontal,
  Filter,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Wrench,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { DeviceStatus } from '@/constants/status'
import { formatRelativeTime } from '@/lib/utils/formatters'
import type { Device } from '@/types/models'
import { cn } from '@/lib/utils/cn'
import { DeviceExcelService } from '@/lib/utils/excel'
import { toast } from 'sonner'

interface ModernDeviceTableProps {
  devices: Device[]
  isLoading?: boolean
  pageIndex?: number
  pageSize?: number
  totalCount?: number
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void
}

const statusConfig = {
  [DeviceStatus.ACTIVE]: {
    label: 'Hoạt động',
    icon: CheckCircle2,
    variant: 'default' as const,
    className: 'bg-success-50 text-success-700 border-success-200',
  },
  [DeviceStatus.ERROR]: {
    label: 'Lỗi',
    icon: XCircle,
    variant: 'destructive' as const,
    className: 'bg-error-50 text-error-700 border-error-200',
  },
  [DeviceStatus.INACTIVE]: {
    label: 'Ngưng hoạt động',
    icon: AlertCircle,
    variant: 'secondary' as const,
    className: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  },
  [DeviceStatus.MAINTENANCE]: {
    label: 'Bảo trì',
    icon: Wrench,
    variant: 'outline' as const,
    className: 'bg-warning-50 text-warning-700 border-warning-200',
  },
}

export function ModernDeviceTable({
  devices,
  isLoading,
  pageIndex = 0,
  pageSize = 10,
  totalCount = 0,
  onPaginationChange,
}: ModernDeviceTableProps) {
  const totalPages = Math.ceil(totalCount / pageSize)
  const startItem = pageIndex * pageSize + 1
  const endItem = Math.min((pageIndex + 1) * pageSize, totalCount)

  const handlePageChange = useCallback(
    (newPageIndex: number) => {
      if (onPaginationChange) {
        onPaginationChange({ pageIndex: newPageIndex, pageSize })
      }
    },
    [onPaginationChange, pageSize]
  )

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      if (onPaginationChange) {
        onPaginationChange({ pageIndex: 0, pageSize: newPageSize })
      }
    },
    [onPaginationChange]
  )

  const handleExportExcel = useCallback(async () => {
    try {
      await DeviceExcelService.exportDevices(devices)
      toast.success('Xuất file Excel thành công!')
    } catch (error) {
      toast.error('Lỗi khi xuất file Excel')
      console.error('Export error:', error)
    }
  }, [devices])

  const handleDownloadTemplate = useCallback(async () => {
    try {
      await DeviceExcelService.generateImportTemplate()
      toast.success('Tải file mẫu thành công!')
    } catch (error) {
      toast.error('Lỗi khi tải file mẫu')
      console.error('Template error:', error)
    }
  }, [])
  if (isLoading) {
    return (
      <Card className="shadow-soft-xl border-0">
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="shadow-soft-xl border-0">
      {/* Table Header - Actions only */}
      <div className="border-b bg-neutral-50 px-6 py-4 dark:bg-neutral-800">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700 gap-2 rounded-xl border-2"
            >
              <Filter className="h-4 w-4" />
              Lọc
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700 gap-2 rounded-xl border-2"
            >
              <Download className="h-4 w-4" />
              Xuất Excel
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="hover:border-success-500 hover:bg-success-50 hover:text-success-700 gap-2 rounded-xl border-2"
            >
              <Upload className="h-4 w-4" />
              Tải mẫu
            </Button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="divide-y">
        {devices.map((device, index) => {
          const statusInfo = statusConfig[device.status]
          const StatusIcon = statusInfo.icon

          return (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="group flex items-center gap-6 p-6 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              {/* Device Icon */}
              <div className="bg-brand-50 dark:bg-brand-950 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                <Printer className="text-brand-600 dark:text-brand-400 h-6 w-6" />
              </div>

              {/* Device Info */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/customer-admin/devices/${device.id}`}
                    className="hover:text-brand-600 dark:hover:text-brand-400 font-mono text-sm font-semibold text-neutral-900 transition-colors dark:text-white"
                  >
                    {device.serialNumber}
                  </Link>
                  <Badge className={cn('gap-1 font-medium', statusInfo.className)}>
                    <StatusIcon className="h-3 w-3" />
                    {statusInfo.label}
                  </Badge>
                </div>

                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {device.model}
                </p>

                <div className="flex items-center gap-4 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">📍 {device.location}</span>
                  <span className="flex items-center gap-1">
                    📄 {device.totalPagesUsed?.toLocaleString()} trang
                  </span>
                </div>
              </div>

              {/* Maintenance Info */}
              <div className="hidden shrink-0 space-y-1 text-right lg:block">
                <p className="text-xs text-neutral-500">Bảo trì lần cuối</p>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {formatRelativeTime(device.lastMaintenanceDate || device.createdAt)}
                </p>
              </div>

              {/* Actions */}
              <div className="shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 rounded-xl p-0 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/customer-admin/devices/${device.id}`}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Xem chi tiết
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/customer-admin/devices/${device.id}/edit`}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Chỉnh sửa
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-error-600 flex cursor-pointer items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Empty State */}
      {devices.length === 0 && !isLoading && (
        <div className="py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
            <Printer className="h-8 w-8 text-neutral-400" />
          </div>
          <h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-white">
            Chưa có thiết bị
          </h3>
          <p className="text-muted-foreground mt-2">Thêm thiết bị đầu tiên để bắt đầu quản lý</p>
        </div>
      )}

      {/* Pagination */}
      {devices.length > 0 && totalCount > 0 && (
        <div className="border-t bg-neutral-50 px-6 py-4 dark:bg-neutral-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Items info & Page size */}
            <div className="flex items-center gap-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Hiển thị <span className="font-medium">{startItem}</span> đến{' '}
                <span className="font-medium">{endItem}</span> trong{' '}
                <span className="font-medium">{totalCount}</span> thiết bị
              </p>

              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Hiển thị:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => handlePageSizeChange(Number(value))}
                >
                  <SelectTrigger className="h-9 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(0)}
                disabled={pageIndex === 0}
                className="h-9 w-9 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pageIndex - 1)}
                disabled={pageIndex === 0}
                className="h-9 w-9 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number

                  if (totalPages <= 5) {
                    pageNum = i
                  } else if (pageIndex < 3) {
                    pageNum = i
                  } else if (pageIndex > totalPages - 4) {
                    pageNum = totalPages - 5 + i
                  } else {
                    pageNum = pageIndex - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={pageIndex === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="h-9 w-9 p-0"
                    >
                      {pageNum + 1}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pageIndex + 1)}
                disabled={pageIndex >= totalPages - 1}
                className="h-9 w-9 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages - 1)}
                disabled={pageIndex >= totalPages - 1}
                className="h-9 w-9 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
