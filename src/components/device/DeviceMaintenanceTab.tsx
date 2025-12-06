'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  Wrench,
  Calendar,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  Search,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { serviceRequestsClientService } from '@/lib/api/services/service-requests-client.service'
import type { ServiceRequest } from '@/types/models'
import {
  ServiceRequestStatus,
  Priority,
  SERVICE_REQUEST_STATUS_DISPLAY,
  PRIORITY_DISPLAY,
} from '@/constants/status'
import { cn } from '@/lib/utils'

interface DeviceMaintenanceTabProps {
  deviceId: string
  lastMaintenanceDate?: string | null
  nextMaintenanceDate?: string | null
}

// Status badge styling
const statusColorMap: Record<ServiceRequestStatus, string> = {
  [ServiceRequestStatus.OPEN]:
    'bg-[var(--brand-100)] text-[var(--brand-800)] dark:bg-[var(--brand-900)] dark:text-[var(--brand-400)]',
  [ServiceRequestStatus.IN_PROGRESS]:
    'bg-[var(--warning-50)] text-[var(--warning-500)] dark:bg-yellow-900 dark:text-yellow-300',
  [ServiceRequestStatus.APPROVED]:
    'bg-[var(--color-success-50)] text-[var(--color-success-600)] dark:bg-emerald-900 dark:text-emerald-300',
  [ServiceRequestStatus.RESOLVED]:
    'bg-[var(--color-success-50)] text-[var(--color-success-600)] dark:bg-green-900 dark:text-green-300',
  [ServiceRequestStatus.CLOSED]: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  [ServiceRequestStatus.CANCELLED]:
    'bg-[var(--color-error-50)] text-[var(--color-error-500)] dark:bg-red-900 dark:text-red-300',
}

const priorityColorMap: Record<Priority, string> = {
  [Priority.LOW]: 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]',
  [Priority.NORMAL]: 'bg-[var(--brand-100)] text-[var(--brand-800)]',
  [Priority.HIGH]: 'bg-[var(--warning-50)] text-[var(--warning-500)]',
  [Priority.URGENT]: 'bg-[var(--color-error-50)] text-[var(--color-error-500)]',
}

export function DeviceMaintenanceTab({
  deviceId,
  lastMaintenanceDate,
  nextMaintenanceDate,
}: DeviceMaintenanceTabProps) {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<ServiceRequestStatus | 'ALL'>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const {
    data: serviceRequestsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      'service-requests',
      'device',
      deviceId,
      page,
      limit,
      search,
      statusFilter,
      priorityFilter,
      sortOrder,
    ],
    queryFn: async () => {
      const params: Parameters<typeof serviceRequestsClientService.getAll>[0] = {
        page,
        limit,
        deviceId,
        sortBy: 'createdAt',
        sortOrder,
      }
      if (search) params.search = search
      if (statusFilter !== 'ALL') params.status = statusFilter
      if (priorityFilter !== 'ALL') params.priority = priorityFilter

      return serviceRequestsClientService.getAll(params)
    },
    staleTime: 30000,
    enabled: Boolean(deviceId),
  })

  const serviceRequests = serviceRequestsData?.data ?? []
  const pagination = serviceRequestsData?.pagination
  const totalPages = pagination?.totalPages ?? 1
  const total = pagination?.total ?? 0

  const handleSearch = () => {
    setSearch(searchInput.trim())
    setPage(1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const formatDate = (date?: string | null) => {
    if (!date) return 'Chưa xác định'
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatRelativeTime = (date: string) => {
    const now = new Date()
    const d = new Date(date)
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays < 30) return `${diffDays} ngày trước`
    return formatDate(date)
  }

  return (
    <div className="space-y-6">
      {/* Maintenance Schedule Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-[var(--error-500)]" />
            Lịch bảo trì
          </CardTitle>
          <CardDescription>Thông tin bảo trì và bảo dưỡng thiết bị</CardDescription>
        </CardHeader>
        <CardContent>
          {!lastMaintenanceDate && !nextMaintenanceDate ? (
            <div className="text-muted-foreground p-8 text-center">
              <Calendar className="mx-auto mb-3 h-12 w-12 opacity-20" />
              <p>Chưa có lịch bảo trì</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-[var(--error-200)] bg-gradient-to-br from-[var(--color-error-50)] to-[var(--destructive)] p-6">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-error-50)]">
                    <Calendar className="h-5 w-5 text-[var(--error-500)]" />
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">
                    Bảo trì gần nhất
                  </span>
                </div>
                <p className="text-2xl font-bold text-[var(--color-error-500)]">
                  {formatDate(lastMaintenanceDate)}
                </p>
              </div>

              <div className="rounded-xl border border-[var(--brand-200)] bg-gradient-to-br from-[var(--brand-50)] to-[var(--secondary)] p-6">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-100)]">
                    <Calendar className="h-5 w-5 text-[var(--brand-600)]" />
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">
                    Bảo trì tiếp theo
                  </span>
                </div>
                <p className="text-2xl font-bold text-[var(--brand-700)]">
                  {formatDate(nextMaintenanceDate)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Requests List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-[var(--warning-500)]" />
                Yêu cầu bảo trì
              </CardTitle>
              <CardDescription className="mt-1">
                Danh sách các yêu cầu bảo trì liên quan đến thiết bị này
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Tìm kiếm theo tiêu đề, mô tả..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleSearch}>
                Tìm kiếm
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as ServiceRequestStatus | 'ALL')
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  {Object.entries(SERVICE_REQUEST_STATUS_DISPLAY).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={priorityFilter}
                onValueChange={(v) => {
                  setPriorityFilter(v as Priority | 'ALL')
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Mức độ ưu tiên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  {Object.entries(PRIORITY_DISPLAY).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={sortOrder}
                onValueChange={(v) => {
                  setSortOrder(v as 'asc' | 'desc')
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Mới nhất</SelectItem>
                  <SelectItem value="asc">Cũ nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Service Requests Table */}
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-600)]" />
            </div>
          ) : isError ? (
            <div className="text-muted-foreground p-8 text-center">
              <AlertCircle className="mx-auto mb-3 h-12 w-12 text-[var(--color-error-500)] opacity-20" />
              <p className="text-[var(--color-error-500)]">Đã xảy ra lỗi khi tải dữ liệu</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
                Thử lại
              </Button>
            </div>
          ) : serviceRequests.length === 0 ? (
            <div className="text-muted-foreground p-8 text-center">
              <Wrench className="mx-auto mb-3 h-12 w-12 opacity-20" />
              <p>Chưa có yêu cầu bảo trì nào cho thiết bị này</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold">Số yêu cầu</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">Tiêu đề</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">Mức độ ưu tiên</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">Trạng thái</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">Người phụ trách</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">Ngày tạo</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {serviceRequests.map((sr: ServiceRequest) => (
                      <tr key={sr.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <Link
                            href={`/system/service-requests/${sr.id}`}
                            className="font-mono text-sm font-medium text-[var(--brand-600)] hover:underline"
                          >
                            {sr.requestNumber ?? `#${sr.id.slice(0, 8)}`}
                          </Link>
                        </td>
                        <td className="max-w-[200px] px-4 py-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="truncate font-medium">{sr.title}</div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                              <p className="font-medium">{sr.title}</p>
                              {sr.description && (
                                <p className="text-muted-foreground mt-1 line-clamp-3 text-xs">
                                  {sr.description}
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={priorityColorMap[sr.priority]} variant="secondary">
                            {PRIORITY_DISPLAY[sr.priority]?.label ?? sr.priority}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/service-requests?status=${encodeURIComponent(sr.status)}`}
                            className="inline-block"
                          >
                            <Badge className={statusColorMap[sr.status]} variant="secondary">
                              {SERVICE_REQUEST_STATUS_DISPLAY[sr.status]?.label ?? sr.status}
                            </Badge>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {sr.assignedToName ?? sr.assignedTo ?? (
                            <span className="text-muted-foreground">Chưa phân công</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-muted-foreground text-sm">
                                {formatRelativeTime(sr.createdAt)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{formatDate(sr.createdAt)}</TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Link href={`/system/service-requests/${sr.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link
                              href={`/system/service-requests/${sr.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {serviceRequests.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <span>
                  Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, total)} / {total} kết
                  quả
                </span>
                <Select
                  value={String(limit)}
                  onValueChange={(v) => {
                    setLimit(Number(v))
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-muted-foreground text-sm">
                  Trang {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
