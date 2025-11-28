'use client'
type AnyRecord = Record<string, unknown>
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { serviceRequestsClientService } from '@/lib/api/services/service-requests-client.service'
import ServiceRequestMessages from '@/components/service-request/ServiceRequestMessages'
import { ServiceRequestStatus } from '@/constants/status'
// type Session removed - not needed here
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  TableHeader,
} from '@/components/ui/table'
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  DollarSign,
  Zap,
  ArrowLeft,
  Calendar,
  User,
  Sparkles,
  Info,
  BarChart3,
} from 'lucide-react'

// type Session removed - not needed here

interface Props {
  id: string
}

export function ServiceRequestDetailClient(props: Props) {
  const { id } = props
  const router = useRouter()

  // If cost.createdAt is missing, show placeholder instead of using Date.now()

  // Safely convert unknown values to displayable text
  const toText = (value: unknown): string => {
    if (value === null || value === undefined) return '—'
    if (Array.isArray(value)) return value.map((v) => toText(v)).join(', ')
    const t = typeof value
    if (t === 'string' || t === 'number' || t === 'boolean') return String(value)
    return '—'
  }

  const { data, isLoading } = useQuery({
    queryKey: ['service-requests', 'detail', id],
    queryFn: () => serviceRequestsClientService.getById(id),
  })

  const costsQuery = useQuery({
    queryKey: ['service-requests', id, 'costs'],
    queryFn: () => serviceRequestsClientService.getCosts(id),
    enabled: !!data,
  })

  // Helper function to get status badge styling
  const getStatusStyles = (status: string) => {
    switch (status) {
      case ServiceRequestStatus.IN_PROGRESS:
        return {
          bg: 'bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 dark:from-blue-400/20 dark:via-cyan-400/20 dark:to-blue-400/20',
          text: 'text-blue-700 dark:text-blue-300',
          border: 'border-blue-300/50 dark:border-blue-500/50',
          glow: 'shadow-blue-500/20',
          icon: PlayCircle,
        }
      case ServiceRequestStatus.RESOLVED:
        return {
          bg: 'bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 dark:from-green-400/20 dark:via-emerald-400/20 dark:to-green-400/20',
          text: 'text-green-700 dark:text-green-300',
          border: 'border-green-300/50 dark:border-green-500/50',
          glow: 'shadow-green-500/20',
          icon: CheckCircle2,
        }
      default:
        return {
          bg: 'bg-gradient-to-r from-slate-500/10 via-gray-500/10 to-slate-500/10 dark:from-slate-400/20 dark:via-gray-400/20 dark:to-slate-400/20',
          text: 'text-slate-700 dark:text-slate-300',
          border: 'border-slate-300/50 dark:border-slate-500/50',
          glow: 'shadow-slate-500/20',
          icon: Clock,
        }
    }
  }

  // Helper function to get priority badge styling
  const getPriorityStyles = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return {
          bg: 'bg-gradient-to-r from-red-500/10 via-rose-500/10 to-red-500/10 dark:from-red-400/20 dark:via-rose-400/20 dark:to-red-400/20',
          text: 'text-red-700 dark:text-red-300',
          border: 'border-red-300/50 dark:border-red-500/50',
          glow: 'shadow-red-500/20',
        }
      case 'medium':
        return {
          bg: 'bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 dark:from-amber-400/20 dark:via-yellow-400/20 dark:to-amber-400/20',
          text: 'text-amber-700 dark:text-amber-300',
          border: 'border-amber-300/50 dark:border-amber-500/50',
          glow: 'shadow-amber-500/20',
        }
      case 'low':
        return {
          bg: 'bg-gradient-to-r from-green-500/10 via-lime-500/10 to-green-500/10 dark:from-green-400/20 dark:via-lime-400/20 dark:to-green-400/20',
          text: 'text-green-700 dark:text-green-300',
          border: 'border-green-300/50 dark:border-green-500/50',
          glow: 'shadow-green-500/20',
        }
      default:
        return {
          bg: 'bg-gradient-to-r from-slate-500/10 via-gray-500/10 to-slate-500/10 dark:from-slate-400/20 dark:via-gray-400/20 dark:to-slate-400/20',
          text: 'text-slate-700 dark:text-slate-300',
          border: 'border-slate-300/50 dark:border-slate-500/50',
          glow: 'shadow-slate-500/20',
        }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950">
        <div className="mx-auto max-w-[1600px]">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <div className="h-32 animate-pulse rounded-2xl bg-gradient-to-r from-white/50 to-white/30 backdrop-blur-xl dark:from-slate-800/50 dark:to-slate-800/30" />
              <div className="h-96 animate-pulse rounded-2xl bg-gradient-to-r from-white/50 to-white/30 backdrop-blur-xl dark:from-slate-800/50 dark:to-slate-800/30" />
            </div>
            <div className="space-y-6 lg:col-span-4">
              <div className="h-64 animate-pulse rounded-2xl bg-gradient-to-r from-white/50 to-white/30 backdrop-blur-xl dark:from-slate-800/50 dark:to-slate-800/30" />
              <div className="h-48 animate-pulse rounded-2xl bg-gradient-to-r from-white/50 to-white/30 backdrop-blur-xl dark:from-slate-800/50 dark:to-slate-800/30" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-red-500 to-pink-500 opacity-20 blur-3xl" />
            <AlertCircle className="relative mx-auto mb-6 h-24 w-24 text-slate-400 dark:text-slate-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-slate-800 dark:text-slate-200">
            Không tìm thấy
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Yêu cầu dịch vụ không tồn tại hoặc đã bị xóa
          </p>
        </div>
      </div>
    )
  }

  // API may include nested customer/device objects not present in the TS model
  const customer = (data as unknown as AnyRecord)['customer'] as AnyRecord | undefined
  const device = (data as unknown as AnyRecord)['device'] as AnyRecord | undefined

  const statusStyles = getStatusStyles(data.status)
  const priorityStyles = getPriorityStyles(data.priority)
  const StatusIcon = statusStyles.icon

  // Calculate total costs
  const totalCosts = costsQuery.data?.data.reduce((sum, cost) => sum + cost.totalAmount, 0) || 0
  const totalItems = costsQuery.data?.data.reduce((sum, cost) => sum + cost.items.length, 0) || 0

  return (
    <div className="relative min-h-screen overflow-hidden via-purple-50 to-pink-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950">
      {/* Animated Background Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-96 w-96 animate-pulse rounded-full bg-gradient-to-r from-blue-400/20 to-cyan-400/20 blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-96 w-96 animate-pulse rounded-full bg-gradient-to-r from-purple-400/20 to-pink-400/20 blur-3xl delay-1000" />
        <div className="absolute top-1/2 left-1/2 h-96 w-96 animate-pulse rounded-full bg-gradient-to-r from-indigo-400/20 to-violet-400/20 blur-3xl delay-500" />
      </div>

      <div className="relative z-10 mx-auto max-w-full px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="group mb-4 inline-flex items-center gap-2 border border-white/20 bg-white/60 px-4 py-2 text-slate-700 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-white/80 hover:shadow-lg hover:shadow-blue-500/10 dark:border-slate-700/50 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800/80"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
            <span className="font-medium">Quay lại</span>
          </button>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN - Main Content (8 columns) */}
          <div className="space-y-6 lg:col-span-8">
            {/* Title Card */}
            <div className="rounded-3xl border border-white/30 bg-gradient-to-r from-white/70 via-white/60 to-white/70 p-8 shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:shadow-indigo-500/10 dark:border-slate-700/50 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70">
              <div className="mb-4 flex items-start gap-4">
                <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 p-3 shadow-lg shadow-indigo-500/30">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="mb-3 text-3xl leading-tight font-bold text-slate-900 sm:text-4xl dark:text-white">
                    {data.title}
                  </h1>
                  <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                    {data.description}
                  </p>
                </div>
              </div>

              {/* Customer & Device Info */}
              <div className="mt-4 lg:col-span-2">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
                    <p className="mb-2 text-xs font-semibold tracking-wider text-slate-600 uppercase dark:text-slate-400">
                      Khách hàng
                    </p>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {String(customer?.name ?? (data as unknown as AnyRecord)['customerId'] ?? '')}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {String(customer?.contactPerson ?? '')}
                      {customer?.contactEmail ? ` • ${String(customer.contactEmail)}` : ''}
                    </div>
                    <div className="mt-2 text-sm text-slate-500">{toText(customer?.address)}</div>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
                    <p className="mb-2 text-xs font-semibold tracking-wider text-slate-600 uppercase dark:text-slate-400">
                      Thiết bị
                    </p>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {toText(device?.serialNumber)}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {toText(device?.location)}
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      IP: {toText(device?.ipAddress)}
                    </div>
                    <div className="text-sm text-slate-500">
                      Trạng thái: {toText(device?.status)}
                    </div>
                  </div>
                </div>
              </div>
              <br />
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-slate-600 dark:text-slate-400">ID:</span>
                <code className="rounded-lg border border-slate-300/50 bg-gradient-to-r from-slate-100 to-slate-200 px-3 py-1.5 font-mono text-xs text-slate-800 dark:border-slate-600/50 dark:from-slate-700 dark:to-slate-600 dark:text-slate-200">
                  {data.id.slice(0, 8)}
                </code>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Priority Card */}

              {/* Created Date Card */}

              {/* Assigned To Card */}
              {(data.assignedTo || data.assignedToName) && (
                <div className="group/card relative overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-br from-white/80 to-white/60 p-6 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-xl dark:border-slate-600/40 dark:from-slate-700/80 dark:to-slate-700/60">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />
                  <div className="relative">
                    <div className="mb-3 flex items-center gap-2">
                      <User className="h-5 w-5 text-black dark:text-white" />
                      <p className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400">
                        Người phụ trách
                      </p>
                    </div>
                    <p className="inline-block rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-lg font-bold text-slate-900 dark:bg-slate-600 dark:text-white">
                      {data.assignedToName ?? data.assignedTo}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Costs Section */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/20 bg-gradient-to-r from-white/60 via-white/50 to-white/60 p-6 shadow-xl backdrop-blur-xl dark:border-slate-700/50 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 p-3 shadow-lg shadow-emerald-500/30">
                    <DollarSign className="h-7 w-7 text-white" />
                  </div>
                  <h2 className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-3xl font-bold text-transparent dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400">
                    Chi phí liên quan
                  </h2>
                </div>
              </div>

              {costsQuery.isLoading ? (
                <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/70 to-white/60 p-12 text-center shadow-xl backdrop-blur-xl dark:border-slate-700/50 dark:from-slate-800/70 dark:to-slate-800/60">
                  <Zap className="mx-auto mb-4 h-12 w-12 animate-bounce text-black dark:text-white" />
                  <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
                    Đang tải chi phí...
                  </p>
                </div>
              ) : costsQuery.data && costsQuery.data.data.length === 0 ? (
                <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/70 to-white/60 p-12 text-center shadow-xl backdrop-blur-xl dark:border-slate-700/50 dark:from-slate-800/70 dark:to-slate-800/60">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 blur-2xl" />
                    <AlertCircle className="relative mx-auto mb-4 h-16 w-16 text-slate-400 dark:text-slate-600" />
                  </div>
                  <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
                    Chưa có chi phí nào được ghi nhận
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {costsQuery.data?.data.map((cost) => (
                    <div
                      key={cost.id}
                      className="group overflow-hidden rounded-3xl border border-white/30 bg-gradient-to-br from-white/70 via-white/60 to-white/70 shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:scale-[1.01] hover:shadow-emerald-500/10 dark:border-slate-700/50 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70"
                    >
                      {/* Cost Header */}
                      <div className="relative border-b border-emerald-200/50 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 px-8 py-6 dark:border-emerald-700/50 dark:from-emerald-400/20 dark:via-teal-400/20 dark:to-cyan-400/20">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        <div className="relative flex flex-wrap items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 p-2 shadow-lg shadow-emerald-500/30">
                                <DollarSign className="h-5 w-5 text-white" />
                              </div>
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                Chi phí #{cost.id.slice(0, 8)}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Tạo lúc:{' '}
                                {cost.createdAt
                                  ? new Date(cost.createdAt).toLocaleDateString('vi-VN', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })
                                  : '—'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-4xl font-bold text-transparent dark:from-emerald-400 dark:to-teal-400">
                              {cost.totalAmount.toLocaleString()}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-400">
                              {cost.currency}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Cost Items Table */}
                      {cost.items.length === 0 ? (
                        <div className="p-10 text-center">
                          <AlertCircle className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                          <p className="font-medium text-slate-600 dark:text-slate-400">
                            Không có mục chi phí
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-b border-slate-200 hover:bg-transparent dark:border-slate-700">
                                <TableHead className="text-sm font-bold tracking-wide text-slate-800 uppercase dark:text-slate-200">
                                  Loại chi phí
                                </TableHead>
                                <TableHead className="text-sm font-bold tracking-wide text-slate-800 uppercase dark:text-slate-200">
                                  Ghi chú
                                </TableHead>
                                <TableHead className="text-right text-sm font-bold tracking-wide text-slate-800 uppercase dark:text-slate-200">
                                  Số tiền
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {cost.items.map((it) => (
                                <TableRow
                                  key={it.id}
                                  className="border-b border-slate-100 transition-all duration-300 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 dark:border-slate-700/50 dark:hover:from-emerald-900/10 dark:hover:to-teal-900/10"
                                >
                                  <TableCell className="py-5">
                                    <span className="inline-flex items-center gap-2 rounded-xl border border-blue-200/50 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-4 py-2 font-semibold text-blue-700 dark:border-blue-700/50 dark:from-blue-400/20 dark:to-cyan-400/20 dark:text-blue-300">
                                      <Sparkles className="h-4 w-4" />
                                      {it.type}
                                    </span>
                                  </TableCell>
                                  <TableCell className="py-5">
                                    {it.note ? (
                                      <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {it.note}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 italic dark:text-slate-600">
                                        Không có ghi chú
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="py-5 text-right">
                                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                                      {it.amount.toLocaleString()}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {/* Total Row */}
                              <TableRow className="border-t-2 border-emerald-300 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 dark:border-emerald-700 dark:from-emerald-900/30 dark:via-teal-900/30 dark:to-emerald-900/30">
                                <TableCell colSpan={2} className="py-6 text-right">
                                  <span className="text-xl font-bold tracking-wide text-slate-900 uppercase dark:text-white">
                                    Tổng cộng:
                                  </span>
                                </TableCell>
                                <TableCell className="py-6 text-right">
                                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-3xl font-bold text-transparent dark:from-emerald-400 dark:to-teal-400">
                                    {cost.totalAmount.toLocaleString()}
                                  </span>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      )}
                      {/* Conversation (user) */}
                      <div className="mt-6">
                        <ServiceRequestMessages serviceRequestId={id} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - Sidebar (4 columns) */}
          <div className="space-y-6 lg:col-span-4">
            {/* Summary Card */}
            <div className="sticky top-6 rounded-3xl border border-white/30 bg-gradient-to-br from-white/70 via-white/60 to-white/70 p-6 shadow-2xl backdrop-blur-2xl dark:border-slate-700/50 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 p-2 shadow-lg shadow-blue-500/30">
                  <Info className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Tóm tắt</h3>
              </div>

              <div className="space-y-4">
                {/* Status & Priority */}
                <div className="rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/50 p-4 dark:from-slate-700/50 dark:to-slate-600/50">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      Trạng thái
                    </span>
                    <div
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1 ${statusStyles.bg} ${statusStyles.border} border text-xs`}
                    >
                      <StatusIcon className={`h-3.5 w-3.5 ${statusStyles.text}`} />
                      <span className={`font-bold ${statusStyles.text}`}>{data.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      Độ ưu tiên
                    </span>
                    <div
                      className={`rounded-lg px-3 py-1 ${priorityStyles.bg} ${priorityStyles.border} border text-xs`}
                    >
                      <span className={`font-bold ${priorityStyles.text} uppercase`}>
                        {data.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-purple-100/50 p-4 dark:from-indigo-900/20 dark:to-purple-900/20">
                  <div className="mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-black dark:text-white" />
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      Thời gian
                    </span>
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatRelativeTime(data.createdAt)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {new Date(data.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Assigned Person */}
                {(data.assignedTo || data.assignedToName) && (
                  <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-100/50 p-4 dark:from-green-900/20 dark:to-emerald-900/20">
                    <div className="mb-3 flex items-center gap-2">
                      <User className="h-4 w-4 text-black dark:text-white" />
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                        Phụ trách
                      </span>
                    </div>
                    <p className="inline-block rounded bg-slate-100 px-2 py-1 font-mono text-sm font-bold text-slate-900 dark:bg-slate-700 dark:text-white">
                      {data.assignedToName ?? data.assignedTo}
                    </p>
                  </div>
                )}

                {/* Cost Statistics */}
                {!costsQuery.isLoading && costsQuery.data && costsQuery.data.data.length > 0 && (
                  <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-100/50 p-4 dark:from-emerald-900/20 dark:to-teal-900/20">
                    <div className="mb-4 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-black dark:text-white" />
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                        Thống kê chi phí
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          Tổng chi phí
                        </span>
                        <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-2xl font-bold text-transparent dark:from-emerald-400 dark:to-teal-400">
                          {totalCosts.toLocaleString()}
                        </span>
                      </div>

                      <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600" />

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-white/50 p-2 text-center dark:bg-slate-700/50">
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {costsQuery.data.data.length}
                          </p>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                            Phiếu chi
                          </p>
                        </div>
                        <div className="rounded-lg bg-white/50 p-2 text-center dark:bg-slate-700/50">
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {totalItems}
                          </p>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                            Mục chi phí
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
