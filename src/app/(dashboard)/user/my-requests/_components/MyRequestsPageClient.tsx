'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  FileText,
  Search,
  Loader2,
  Plus,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { ServiceRequestStatus, Priority } from '@/constants/status'
import type { ServiceRequest } from '@/types/models'
import { serviceRequestsClientService } from '@/lib/api/services/service-requests-client.service'
import { getClientUserProfile } from '@/lib/auth/client-auth'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ServiceRequestFormModal } from './ServiceRequestFormModal'
import { ServiceRequestDetailModal } from './ServiceRequestDetailModal'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

const statusConfig = {
  [ServiceRequestStatus.OPEN]: {
    label: 'Mở',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    cardBg: 'bg-white dark:bg-slate-900',
    border: 'border-l-4 border-l-slate-400',
    icon: Clock,
    badgeVariant: 'secondary',
  },
  [ServiceRequestStatus.IN_PROGRESS]: {
    label: 'Đang xử lý',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    cardBg: 'bg-blue-50/30 dark:bg-blue-900/10',
    border: 'border-l-4 border-l-blue-500',
    icon: RefreshCw,
    badgeVariant: 'info',
  },
  [ServiceRequestStatus.RESOLVED]: {
    label: 'Đã xử lý',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    cardBg: 'bg-green-50/30 dark:bg-green-900/10',
    border: 'border-l-4 border-l-green-500',
    icon: CheckCircle2,
    badgeVariant: 'success',
  },
  [ServiceRequestStatus.CLOSED]: {
    label: 'Đóng',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    cardBg: 'bg-gray-50/50 dark:bg-gray-900/50',
    border: 'border-l-4 border-l-gray-500',
    icon: XCircle,
    badgeVariant: 'secondary',
  },
}

const priorityConfig = {
  [Priority.LOW]: {
    label: 'Thấp',
    color: 'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800',
    icon: TrendingUp,
    description: 'Yêu cầu không gấp, sẽ được xử lý theo thứ tự.',
  },
  [Priority.NORMAL]: {
    label: 'Bình thường',
    color: 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30',
    icon: TrendingUp,
    description: 'Yêu cầu tiêu chuẩn, xử lý trong thời gian quy định.',
  },
  [Priority.HIGH]: {
    label: 'Cao',
    color: 'text-orange-600 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/30',
    icon: AlertCircle,
    description: 'Yêu cầu quan trọng, cần xử lý sớm.',
  },
  [Priority.URGENT]: {
    label: 'Khẩn cấp',
    color: 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900/30',
    icon: AlertCircle,
    description: 'Sự cố nghiêm trọng, cần xử lý ngay lập tức.',
  },
}

export default function MyRequestsPageClient() {
  const queryClient = useQueryClient()
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Selection & Modal State
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [closeModalOpen, setCloseModalOpen] = useState(false)
  const [closeReason, setCloseReason] = useState('')
  const [isClosing, setIsClosing] = useState(false)

  // Load customerId from user profile
  useEffect(() => {
    let mounted = true
    const loadCustomerId = async () => {
      try {
        const profile = await getClientUserProfile()
        if (!mounted) return
        if (profile?.user?.customerId) {
          setCustomerId(profile.user.customerId)
        } else {
          toast.error('Không thể lấy thông tin khách hàng')
        }
      } catch (err) {
        if (!mounted) return
        console.error('Failed to load client profile', err)
        toast.error('Không thể tải thông tin người dùng')
      }
    }
    loadCustomerId()
    return () => {
      mounted = false
    }
  }, [])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 2000)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch service requests
  const {
    data: requestsData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      'service-requests',
      customerId,
      page,
      limit,
      debouncedSearch,
      priorityFilter,
      statusFilter,
    ],
    queryFn: () =>
      serviceRequestsClientService.getAll({
        page,
        limit,
        search: debouncedSearch || undefined,
        customerId: customerId || undefined,
        priority: priorityFilter !== 'all' ? (priorityFilter as Priority) : undefined,
        status: statusFilter !== 'all' ? (statusFilter as ServiceRequestStatus) : undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    enabled: !!customerId,
    placeholderData: (previousData) => previousData, // Keep previous data while fetching to avoid flashing
  })

  const requests = requestsData?.data || []
  const pagination = requestsData?.pagination

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['service-requests'] })
    refetch()
    toast.success('Đã làm mới danh sách')
  }

  const handleRequestClick = (id: string) => {
    if (isSelectionMode) {
      toggleSelection(id)
    } else {
      setSelectedRequestId(id)
      setIsDetailOpen(true)
    }
  }

  const handleCloseSelected = async () => {
    if (!closeReason.trim()) {
      toast.error('Vui lòng nhập lý do đóng yêu cầu')
      return
    }
    const ids = Array.from(selectedIds)
    if (!ids.length) return
    setIsClosing(true)
    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          serviceRequestsClientService.updateStatus(id, {
            status: ServiceRequestStatus.CLOSED,
            customerCloseReason: closeReason.trim(),
          })
        )
      )
      const successCount = results.filter((r) => r.status === 'fulfilled').length
      const failCount = results.length - successCount
      if (successCount > 0) {
        toast.success(`Đã đóng ${successCount} yêu cầu`)
      }
      if (failCount > 0) {
        toast.error(`Có ${failCount} yêu cầu không đóng được`)
      }
      // Refresh list and reset selection
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      refetch()
      setSelectedIds(new Set())
      setIsSelectionMode(false)
      setCloseModalOpen(false)
      setCloseReason('')
    } catch (err) {
      console.error('Close selected error', err)
      toast.error('Có lỗi khi đóng yêu cầu')
    } finally {
      setIsClosing(false)
    }
  }

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === requests.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(requests.map((r) => r.id)))
    }
  }

  const isFiltered = debouncedSearch || priorityFilter !== 'all' || statusFilter !== 'all'

  type BadgeVariant =
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'warning'
    | 'info'
  const normalizeBadgeVariant = (v: unknown): BadgeVariant => {
    const s = String(v)
    const allowed = new Set<BadgeVariant>([
      'default',
      'secondary',
      'destructive',
      'outline',
      'success',
      'warning',
      'info',
    ])
    return allowed.has(s as BadgeVariant) ? (s as BadgeVariant) : 'default'
  }

  if (!customerId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-slate-50/50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <PageHeader
          title="Yêu Cầu Của Tôi"
          subtitle="Quản lý và theo dõi tiến độ xử lý yêu cầu dịch vụ"
          icon={<FileText className="h-6 w-6 text-white" />}
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => setIsSelectionMode(!isSelectionMode)}
                className={
                  isSelectionMode
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                }
              >
                {isSelectionMode ? 'Hủy chọn' : 'Chọn nhiều'}
              </Button>
              <ServiceRequestFormModal customerId={customerId} onSuccess={handleRefresh}>
                <Button className="bg-white text-blue-600 shadow-lg hover:bg-blue-50">
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo Yêu Cầu
                </Button>
              </ServiceRequestFormModal>
            </div>
          }
          className="mb-6"
        />

        {/* Filters & Search Bar */}
        <div className="sticky top-0 z-30 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm kiếm theo tiêu đề, mô tả..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setDebouncedSearch(search)
                    setPage(1)
                  }
                }}
                className="bg-white pl-9 dark:bg-slate-950"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[160px] bg-white dark:bg-slate-950">
                  <SelectValue placeholder="Độ ưu tiên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả độ ưu tiên</SelectItem>
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className={`h-4 w-4 ${config.color.split(' ')[0]}`} />
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] bg-white dark:bg-slate-950">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className="h-4 w-4" />
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Page size selector */}
              <Select
                value={String(limit)}
                onValueChange={(v) => {
                  setLimit(Number(v))
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[110px] bg-white dark:bg-slate-950">
                  <SelectValue placeholder="20" />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 30, 50].map((sz) => (
                    <SelectItem key={sz} value={String(sz)}>
                      {sz}/trang
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isFiltered && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSearch('')
                    setPriorityFilter('all')
                    setStatusFilter('all')
                    setLimit(20)
                    setPage(1)
                  }}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {isSelectionMode && selectedIds.size > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Đã chọn {selectedIds.size} yêu cầu
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-slate-600"
                  onClick={() => setCloseModalOpen(true)}
                >
                  Đóng yêu cầu
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {isLoading && !requests.length ? (
            // Initial Loading Skeleton
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-white dark:bg-slate-900" />
            ))
          ) : requests.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 py-16 text-center dark:border-slate-700 dark:bg-slate-900/50">
              <div className="mb-4 rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {isFiltered ? 'Không tìm thấy yêu cầu' : 'Chưa có yêu cầu nào'}
              </h3>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                {isFiltered
                  ? 'Thử thay đổi bộ lọc hoặc tìm kiếm'
                  : 'Tạo yêu cầu mới để bắt đầu theo dõi'}
              </p>
            </div>
          ) : (
            <>
              {/* List Header with Select All */}
              {isSelectionMode && (
                <div className="flex items-center gap-3 px-4">
                  <Checkbox
                    checked={selectedIds.size === requests.length && requests.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Chọn tất cả
                  </span>
                </div>
              )}

              {/* Cards */}
              <div className={`space-y-3 ${isFetching ? 'opacity-70 transition-opacity' : ''}`}>
                {requests.map((request: ServiceRequest) => {
                  const status = statusConfig[request.status]
                  const priority = priorityConfig[request.priority]

                  return (
                    <div
                      key={request.id}
                      onClick={() => handleRequestClick(request.id)}
                      className={`group shadow-card relative flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all hover:shadow-md ${status.cardBg} ${status.border} border-y-slate-200 border-r-slate-200 dark:border-y-slate-800 dark:border-r-slate-800`}
                    >
                      {isSelectionMode && (
                        <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(request.id)}
                            onCheckedChange={() => toggleSelection(request.id)}
                          />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                              {request.title}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                              {request.description}
                            </p>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${priority.color}`}
                                >
                                  <priority.icon className="h-3.5 w-3.5" />
                                  {priority.label}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{priority.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                          <StatusBadge
                            status={status.label}
                            variant={normalizeBadgeVariant(status.badgeVariant)}
                          />

                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="text-xs">{formatRelativeTime(request.createdAt)}</span>
                          </div>

                          <div className="ml-auto opacity-0 transition-opacity group-hover:opacity-100">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {pagination && (
                <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm md:flex-row md:items-center md:justify-between dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-600 dark:text-slate-400">
                      Trang{' '}
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {pagination.page}
                      </span>{' '}
                      / {pagination.totalPages}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Hiển thị {(pagination.page - 1) * pagination.limit + 1}-
                      {Math.min(pagination.page * pagination.limit, pagination.total)} trong{' '}
                      <span className="font-medium">{pagination.total}</span> yêu cầu
                    </span>
                    {isFetching && (
                      <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải...
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || isFetching}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages || isFetching}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ServiceRequestDetailModal
        requestId={selectedRequestId}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />

      {/* Close Requests Modal (bulk) */}
      <Dialog open={closeModalOpen} onOpenChange={setCloseModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Đóng yêu cầu đã chọn</DialogTitle>
            <DialogDescription>
              Khi đóng yêu cầu, vui lòng cung cấp lý do (bắt buộc).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Textarea
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              placeholder="Nhập lý do đóng yêu cầu"
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCloseModalOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleCloseSelected} disabled={isClosing || !closeReason.trim()}>
                {isClosing ? 'Đang đóng...' : 'Đóng yêu cầu'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
