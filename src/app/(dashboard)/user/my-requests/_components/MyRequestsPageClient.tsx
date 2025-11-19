'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
// card components removed; not used in this client file
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FileText,
  Search,
  Loader2,
  Plus,
  ChevronRight,
  AlertCircle,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
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

const statusConfig = {
  [ServiceRequestStatus.OPEN]: {
    label: 'Mở',
    color:
      'bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 dark:from-blue-400/20 dark:via-cyan-400/20 dark:to-blue-400/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-300/50 dark:border-blue-500/50',
    icon: Clock,
    gradient: 'from-blue-500 to-cyan-500',
  },
  [ServiceRequestStatus.IN_PROGRESS]: {
    label: 'Đang xử lý',
    color:
      'bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 dark:from-amber-400/20 dark:via-yellow-400/20 dark:to-amber-400/20',
    textColor: 'text-amber-700 dark:text-amber-300',
    borderColor: 'border-amber-300/50 dark:border-amber-500/50',
    icon: RefreshCw,
    gradient: 'from-amber-500 to-yellow-500',
  },
  [ServiceRequestStatus.RESOLVED]: {
    label: 'Đã xử lý',
    color:
      'bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 dark:from-green-400/20 dark:via-emerald-400/20 dark:to-green-400/20',
    textColor: 'text-green-700 dark:text-green-300',
    borderColor: 'border-green-300/50 dark:border-green-500/50',
    icon: CheckCircle2,
    gradient: 'from-green-500 to-emerald-500',
  },
  [ServiceRequestStatus.CLOSED]: {
    label: 'Đóng',
    color:
      'bg-gradient-to-r from-slate-500/10 via-gray-500/10 to-slate-500/10 dark:from-slate-400/20 dark:via-gray-400/20 dark:to-slate-400/20',
    textColor: 'text-slate-700 dark:text-slate-300',
    borderColor: 'border-slate-300/50 dark:border-slate-500/50',
    icon: XCircle,
    gradient: 'from-slate-500 to-gray-500',
  },
}

const priorityConfig = {
  [Priority.LOW]: {
    label: 'Thấp',
    color:
      'bg-gradient-to-r from-slate-500/10 via-gray-500/10 to-slate-500/10 dark:from-slate-400/20 dark:via-gray-400/20 dark:to-slate-400/20',
    textColor: 'text-slate-700 dark:text-slate-300',
    borderColor: 'border-slate-300/50 dark:border-slate-500/50',
    gradient: 'from-slate-500 to-gray-500',
  },
  [Priority.NORMAL]: {
    label: 'Bình thường',
    color:
      'bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 dark:from-blue-400/20 dark:via-indigo-400/20 dark:to-blue-400/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-300/50 dark:border-blue-500/50',
    gradient: 'from-blue-500 to-indigo-500',
  },
  [Priority.HIGH]: {
    label: 'Cao',
    color:
      'bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 dark:from-orange-400/20 dark:via-amber-400/20 dark:to-orange-400/20',
    textColor: 'text-orange-700 dark:text-orange-300',
    borderColor: 'border-orange-300/50 dark:border-orange-500/50',
    gradient: 'from-orange-500 to-amber-500',
  },
  [Priority.URGENT]: {
    label: 'Khẩn cấp',
    color:
      'bg-gradient-to-r from-red-500/10 via-rose-500/10 to-red-500/10 dark:from-red-400/20 dark:via-rose-400/20 dark:to-red-400/20',
    textColor: 'text-red-700 dark:text-red-300',
    borderColor: 'border-red-300/50 dark:border-red-500/50',
    gradient: 'from-red-500 to-rose-500',
  },
}

export default function MyRequestsPageClient() {
  const queryClient = useQueryClient()
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)

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
    }, 300)
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
  })

  const requests = requestsData?.data || []
  const pagination = requestsData?.pagination

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['service-requests'] })
    refetch()
  }

  const isFiltered = debouncedSearch || priorityFilter !== 'all' || statusFilter !== 'all'

  if (!customerId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 blur-3xl" />
          <Loader2 className="relative h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950">
      {/* Animated Background Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-96 w-96 animate-pulse rounded-full bg-gradient-to-r from-blue-400/20 to-cyan-400/20 blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-96 w-96 animate-pulse rounded-full bg-gradient-to-r from-purple-400/20 to-pink-400/20 blur-3xl delay-1000" />
        <div className="absolute top-1/2 left-1/2 h-96 w-96 animate-pulse rounded-full bg-gradient-to-r from-indigo-400/20 to-violet-400/20 blur-3xl delay-500" />
      </div>

      <div className="relative z-10 w-full space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="rounded-3xl border border-white/30 bg-gradient-to-r from-white/70 via-white/60 to-white/70 p-6 shadow-2xl backdrop-blur-2xl sm:p-8 dark:border-slate-700/50 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 p-3 shadow-lg shadow-indigo-500/30">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="mb-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
                  Yêu Cầu Của Tôi
                </h1>
                <p className="font-medium text-slate-600 dark:text-slate-400">
                  Quản lý và theo dõi yêu cầu dịch vụ
                </p>
              </div>
            </div>
            <ServiceRequestFormModal customerId={customerId} onSuccess={handleRefresh}>
              <Button className="group w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-500/40 sm:w-auto">
                <Plus className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
                Tạo Yêu Cầu
              </Button>
            </ServiceRequestFormModal>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-3xl border border-white/30 bg-gradient-to-r from-white/70 via-white/60 to-white/70 p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700/50 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="group relative">
              <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors duration-300 group-focus-within:text-blue-500 dark:text-slate-500" />
              <Input
                placeholder="Tìm kiếm theo tiêu đề, mô tả..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl border-slate-300/50 bg-white/60 py-3 pl-12 backdrop-blur-xl transition-all duration-300 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/10 dark:border-slate-600/50 dark:bg-slate-700/60 dark:focus:border-blue-400"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                  showFilters
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30'
                    : 'border border-white/40 bg-white/60 text-slate-700 backdrop-blur-xl hover:bg-white/80 dark:border-slate-600/40 dark:bg-slate-700/60 dark:text-slate-300 dark:hover:bg-slate-700/80'
                }`}
              >
                <Filter
                  className={`h-4 w-4 ${showFilters ? 'rotate-180' : ''} transition-transform duration-300`}
                />
                Bộ lọc
                {isFiltered && (
                  <span className="ml-1 inline-flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-white/30 text-xs font-bold text-white">
                    {(priorityFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)}
                  </span>
                )}
              </button>

              {isFiltered && (
                <button
                  onClick={() => {
                    setSearch('')
                    setPriorityFilter('all')
                    setStatusFilter('all')
                  }}
                  className="flex items-center gap-2 rounded-xl border border-blue-200/50 bg-blue-50/60 px-4 py-2.5 text-sm font-medium text-blue-600 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:text-blue-700 dark:border-blue-700/50 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <XCircle className="h-4 w-4" />
                  Xóa bộ lọc
                </button>
              )}
            </div>

            {/* Filter Selects - Collapsible */}
            {showFilters && (
              <div className="animate-in slide-in-from-top-2 grid grid-cols-1 gap-4 border-t border-slate-200/50 pt-4 duration-300 sm:grid-cols-2 dark:border-slate-700/50">
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="rounded-xl border-slate-300/50 bg-white/60 backdrop-blur-xl transition-colors duration-300 hover:border-blue-400 dark:border-slate-600/50 dark:bg-slate-700/60 dark:hover:border-blue-500">
                    <SelectValue placeholder="Độ ưu tiên" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 bg-white/95 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/95">
                    <SelectItem value="all">Tất cả độ ưu tiên</SelectItem>
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <span className={`inline-flex items-center gap-2 ${config.textColor}`}>
                          <TrendingUp className="h-4 w-4" />
                          {config.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="rounded-xl border-slate-300/50 bg-white/60 backdrop-blur-xl transition-colors duration-300 hover:border-blue-400 dark:border-slate-600/50 dark:bg-slate-700/60 dark:hover:border-blue-500">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 bg-white/95 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/95">
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    {Object.entries(statusConfig).map(([key, config]) => {
                      const Icon = config.icon
                      return (
                        <SelectItem key={key} value={key}>
                          <span className={`inline-flex items-center gap-2 ${config.textColor}`}>
                            <Icon className="h-4 w-4" />
                            {config.label}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl bg-gradient-to-r from-white/50 to-white/30 backdrop-blur-xl dark:from-slate-800/50 dark:to-slate-800/30"
              />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-3xl border border-white/30 bg-gradient-to-br from-white/70 via-white/60 to-white/70 p-12 text-center shadow-xl backdrop-blur-2xl dark:border-slate-700/50 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70">
            <div className="relative mb-6 inline-block">
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 blur-3xl" />
              {isFiltered ? (
                <AlertCircle className="relative mx-auto h-20 w-20 text-slate-400 dark:text-slate-600" />
              ) : (
                <FileText className="relative mx-auto h-20 w-20 text-slate-400 dark:text-slate-600" />
              )}
            </div>
            <h3 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">
              {isFiltered ? 'Không tìm thấy yêu cầu' : 'Chưa có yêu cầu nào'}
            </h3>
            <p className="mb-6 text-lg text-slate-600 dark:text-slate-400">
              {isFiltered
                ? 'Thử thay đổi bộ lọc hoặc tìm kiếm để xem thêm'
                : 'Tạo yêu cầu mới để bắt đầu'}
            </p>
            {!isFiltered && (
              <ServiceRequestFormModal customerId={customerId} onSuccess={handleRefresh}>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-500/40">
                  <Plus className="mr-2 h-5 w-5" />
                  Tạo Yêu Cầu Mới
                </Button>
              </ServiceRequestFormModal>
            )}
          </div>
        ) : (
          <>
            {/* Results Summary */}
            <div className="flex items-center justify-between px-2">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Hiển thị <span className="text-blue-600 dark:text-blue-400">{requests.length}</span>{' '}
                yêu cầu
                {pagination && (
                  <span className="text-slate-500 dark:text-slate-500">
                    {' '}
                    / Tổng: {pagination.total}
                  </span>
                )}
              </div>
              {isFetching && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải...
                </div>
              )}
            </div>

            {/* Cards List */}
            <div className="space-y-4">
              {requests.map((request: ServiceRequest) => {
                const statusConfig_ = statusConfig[request.status]
                const priorityConfig_ = priorityConfig[request.priority]
                const StatusIcon = statusConfig_.icon

                return (
                  <Link
                    key={request.id}
                    href={`/user/my-requests/${request.id}`}
                    className="group block"
                  >
                    <div className="relative overflow-hidden rounded-2xl border border-white/30 bg-gradient-to-r from-white/70 via-white/60 to-white/70 shadow-lg backdrop-blur-2xl transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10 dark:border-slate-700/50 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70">
                      {/* Hover Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                      <div className="relative p-6">
                        <div className="flex items-start gap-5">
                          {/* Icon with Gradient */}
                          <div className="mt-1 flex-shrink-0">
                            <div
                              className={`relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${statusConfig_.gradient} shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
                            >
                              <div className="absolute inset-0 rounded-xl bg-white/20" />
                              <StatusIcon className="relative h-7 w-7 text-white" />
                            </div>
                          </div>

                          {/* Main Content */}
                          <div className="min-w-0 flex-1">
                            <div className="mb-3 flex items-start justify-between gap-4">
                              <h3 className="line-clamp-1 text-xl font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                                {request.title}
                              </h3>
                              <ChevronRight className="h-6 w-6 flex-shrink-0 text-slate-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                            </div>

                            {/* Description */}
                            <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                              {request.description}
                            </p>

                            {/* Badges & Meta */}
                            <div className="mb-3 flex flex-wrap items-center gap-2.5">
                              <div
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 ${statusConfig_.color} ${statusConfig_.borderColor} border text-xs font-bold backdrop-blur-sm transition-all duration-300 hover:scale-105`}
                              >
                                <StatusIcon className={`h-3.5 w-3.5 ${statusConfig_.textColor}`} />
                                <span className={statusConfig_.textColor}>
                                  {statusConfig_.label}
                                </span>
                              </div>
                              <div
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 ${priorityConfig_.color} ${priorityConfig_.borderColor} border text-xs font-bold backdrop-blur-sm transition-all duration-300 hover:scale-105`}
                              >
                                <TrendingUp
                                  className={`h-3.5 w-3.5 ${priorityConfig_.textColor}`}
                                />
                                <span className={priorityConfig_.textColor}>
                                  {priorityConfig_.label}
                                </span>
                              </div>
                            </div>

                            {/* Timestamp */}
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                              <Clock className="h-3.5 w-3.5" />
                              <span className="font-medium">
                                {formatRelativeTime(request.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="rounded-2xl border border-white/30 bg-gradient-to-r from-white/70 via-white/60 to-white/70 p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700/50 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Trang{' '}
                    <span className="text-lg text-blue-600 dark:text-blue-400">
                      {pagination.page}
                    </span>
                    {' / '}
                    <span className="text-lg text-slate-900 dark:text-white">
                      {pagination.totalPages}
                    </span>
                    <span className="ml-2 text-slate-500 dark:text-slate-500">
                      ({pagination.total} yêu cầu)
                    </span>
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || isFetching}
                      className="border-slate-300/50 bg-white/60 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-white/80 disabled:opacity-50 disabled:hover:scale-100 dark:border-slate-600/50 dark:bg-slate-700/60 dark:hover:bg-slate-700/80"
                    >
                      ← Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages || isFetching}
                      className="border-slate-300/50 bg-white/60 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-white/80 disabled:opacity-50 disabled:hover:scale-100 dark:border-slate-600/50 dark:bg-slate-700/60 dark:hover:bg-slate-700/80"
                    >
                      Sau →
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
