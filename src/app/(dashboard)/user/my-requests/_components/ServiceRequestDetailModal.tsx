'use client'

import { useQuery } from '@tanstack/react-query'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { serviceRequestsClientService } from '@/lib/api/services/service-requests-client.service'
import { ServiceRequestStatus } from '@/constants/status'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  Calendar,
  User,
  Info,
  Loader2,
} from 'lucide-react'

interface ServiceRequestDetail {
  id: string
  title?: string
  description?: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  customer?: { name?: string } | null
  customerId?: string
  device?: { serialNumber?: string; location?: string } | null
}

interface ServiceRequestDetailModalProps {
  requestId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ServiceRequestDetailModal({
  requestId,
  open,
  onOpenChange,
}: ServiceRequestDetailModalProps) {
  // Safely convert unknown values to displayable text
  // (Removed unused helpers — kept implementation focused on rendering fetched data)

  const { data, isLoading } = useQuery({
    queryKey: ['service-requests', 'detail', requestId],
    queryFn: () => (requestId ? serviceRequestsClientService.getById(requestId) : null),
    enabled: !!requestId && open,
  })

  const costsQuery = useQuery({
    queryKey: ['service-requests', requestId, 'costs'],
    queryFn: () => (requestId ? serviceRequestsClientService.getCosts(requestId) : null),
    enabled: !!data && !!requestId && open,
  })

  // Helper function to get status badge styling
  const getStatusStyles = (status: string) => {
    switch (status) {
      case ServiceRequestStatus.IN_PROGRESS:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          text: 'text-blue-700 dark:text-blue-300',
          border: 'border-blue-200 dark:border-blue-800',
          icon: PlayCircle,
        }
      case ServiceRequestStatus.RESOLVED:
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          text: 'text-green-700 dark:text-green-300',
          border: 'border-green-200 dark:border-green-800',
          icon: CheckCircle2,
        }
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-800/50',
          text: 'text-slate-700 dark:text-slate-300',
          border: 'border-slate-200 dark:border-slate-700',
          icon: Clock,
        }
    }
  }

  // Helper function to get priority badge styling
  const getPriorityStyles = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'urgent':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          text: 'text-red-700 dark:text-red-300',
          border: 'border-red-200 dark:border-red-800',
        }
      case 'medium':
      case 'normal':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          text: 'text-amber-700 dark:text-amber-300',
          border: 'border-amber-200 dark:border-amber-800',
        }
      case 'low':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          text: 'text-green-700 dark:text-green-300',
          border: 'border-green-200 dark:border-green-800',
        }
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-800/50',
          text: 'text-slate-700 dark:text-slate-300',
          border: 'border-slate-200 dark:border-slate-700',
        }
    }
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/80">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Chi tiết yêu cầu
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
            </div>
          ) : !data ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <AlertCircle className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="text-slate-600 dark:text-slate-400">Không tìm thấy thông tin yêu cầu</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Header Info */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {data.title}
                    </h2>
                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Clock className="h-4 w-4" />
                      <span>Tạo {formatRelativeTime(data.createdAt)}</span>
                      <span>•</span>
                      <span className="font-mono">ID: {data.id.slice(0, 8)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {(() => {
                      const statusStyles = getStatusStyles(data.status)
                      const StatusIcon = statusStyles.icon
                      return (
                        <div
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${statusStyles.bg} ${statusStyles.text} ${statusStyles.border}`}
                        >
                          <StatusIcon className="h-4 w-4" />
                          {data.status}
                        </div>
                      )
                    })()}
                    {(() => {
                      const priorityStyles = getPriorityStyles(data.priority)
                      return (
                        <div
                          className={`rounded-full border px-3 py-1 text-xs font-medium uppercase ${priorityStyles.bg} ${priorityStyles.text} ${priorityStyles.border}`}
                        >
                          {data.priority}
                        </div>
                      )
                    })()}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                  <p className="text-slate-700 dark:text-slate-300">{data.description}</p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Customer & Device */}
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    <User className="h-4 w-4" />
                    Thông tin liên quan
                  </h3>
                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase dark:text-slate-400">
                          Khách hàng
                        </p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {(() => {
                            const d = data as ServiceRequestDetail
                            return d.customer?.name || d.customerId || '—'
                          })()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase dark:text-slate-400">
                          Thiết bị
                        </p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {(() => {
                            const d = data as ServiceRequestDetail
                            return d.device?.serialNumber || '—'
                          })()}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {(() => {
                            const d = data as ServiceRequestDetail
                            return d.device?.location || '—'
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assignment & Timeline */}
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    <Calendar className="h-4 w-4" />
                    Tiến độ xử lý
                  </h3>
                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase dark:text-slate-400">
                          Người phụ trách
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          {data.assignedTo ? (
                            <span className="rounded bg-slate-100 px-2 py-1 font-medium text-slate-900 dark:bg-slate-700 dark:text-white">
                              {data.assignedTo}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-500 italic">Chưa phân công</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase dark:text-slate-400">
                          Cập nhật lần cuối
                        </p>
                        <p className="text-sm text-slate-900 dark:text-white">
                          {formatRelativeTime(data.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Costs Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    <DollarSign className="h-4 w-4" />
                    Chi phí phát sinh
                  </h3>
                  {costsQuery.data && costsQuery.data.data.length > 0 && (
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {costsQuery.data.data
                        .reduce((sum, cost) => sum + cost.totalAmount, 0)
                        .toLocaleString()}{' '}
                      VND
                    </span>
                  )}
                </div>

                {costsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : costsQuery.data && costsQuery.data.data.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center dark:border-slate-700">
                    <p className="text-slate-500 dark:text-slate-400">
                      Chưa có chi phí nào được ghi nhận
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {costsQuery.data?.data.map((cost) => (
                      <div
                        key={cost.id}
                        className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
                      >
                        <div className="bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-900 dark:text-white">
                              Phiếu #{cost.id.slice(0, 8)}
                            </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {cost.totalAmount.toLocaleString()} {cost.currency}
                            </span>
                          </div>
                        </div>
                        <div className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Loại</TableHead>
                                <TableHead>Ghi chú</TableHead>
                                <TableHead className="text-right">Số tiền</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {cost.items.map((it) => (
                                <TableRow key={it.id}>
                                  <TableCell className="font-medium">{it.type}</TableCell>
                                  <TableCell className="text-slate-500">{it.note || '—'}</TableCell>
                                  <TableCell className="text-right font-medium">
                                    {it.amount.toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
