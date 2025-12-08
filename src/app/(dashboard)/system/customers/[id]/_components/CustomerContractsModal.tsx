'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Loader2,
  FileText,
  Calendar,
  Tag,
  Building2,
  Search,
  Filter,
  X,
  ChevronDown,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useLocale } from '@/components/providers/LocaleProvider'
import { VN } from '@/constants/vietnamese'
import Link from 'next/link'

interface Contract {
  id: string
  contractNumber: string
  type: string
  status: string
  startDate: string
  endDate: string
  description?: string
  documentUrl?: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: string
  customerName: string
}

export default function CustomerContractsModal({
  open,
  onOpenChange,
  customerId,
  customerName,
}: Props) {
  const { t } = useLocale()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(false)
  const [page] = useState(1)
  const [limit] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !customerId) return

    const fetchCustomerContracts = async () => {
      setLoading(true)
      try {
        const query = new URLSearchParams()
        query.set('page', String(page))
        query.set('limit', String(limit))

        const url = `/api/customers/${customerId}/contracts?${query.toString()}`
        const res = await fetch(url)

        if (!res.ok) {
          const txt = await res.text().catch(() => '')
          throw new Error(txt || res.statusText)
        }

        const data = await res.json()

        // Handle different response formats
        let list: Contract[] = []
        if (Array.isArray(data)) {
          list = data
        } else if (Array.isArray(data.data)) {
          list = data.data
        } else if (data.success && Array.isArray(data.data)) {
          list = data.data
        }

        setContracts(list)
      } catch (err) {
        console.error('Failed to fetch customer contracts', err)
        toast.error(t('contract.fetch_error_customer'))
      } finally {
        setLoading(false)
      }
    }

    fetchCustomerContracts()
  }, [open, customerId, page, limit, t])

  // Reset filters when modal closes
  useEffect(() => {
    if (!open) {
      setSearchTerm('')
      setStatusFilter('')
      setTypeFilter('')
      setShowFilters(false)
      setExpandedRow(null)
    }
  }, [open])

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
      case 'PENDING':
        return 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
      case 'EXPIRED':
        return 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'
      default:
        return 'bg-slate-500 hover:bg-slate-600 shadow-slate-200'
    }
  }

  const getStatusLabel = (status?: string) => {
    if (!status) return '—'
    switch (status) {
      case 'ACTIVE':
        return VN.status.active
      case 'PENDING':
        return VN.status.pending
      case 'EXPIRED':
        return VN.status.expired
      case 'TERMINATED':
        return VN.status.terminated
      default:
        return status
    }
  }

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'MPS_CLICK_CHARGE':
      case 'MPS_CONSUMABLE':
        return 'bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-200)] hover:bg-[var(--brand-100)]'
      case 'CMPS_CLICK_CHARGE':
      case 'CMPS_CONSUMABLE':
        return 'bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-200)] hover:bg-[var(--brand-100)]'
      case 'PARTS_REPAIR_SERVICE':
        return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
    }
  }

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch = contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || contract.status === statusFilter
    const matchesType = !typeFilter || contract.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const hasActiveFilters = searchTerm || statusFilter || typeFilter

  const clearAllFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setTypeFilter('')
  }

  const toggleRowExpansion = (contractId: string) => {
    setExpandedRow(expandedRow === contractId ? null : contractId)
  }

  // Count contracts by status
  const statusCounts = contracts.reduce(
    (acc, contract) => {
      acc[contract.status] = (acc[contract.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SystemModalLayout
        title={t('page.contracts.customer_title')}
        description={customerName}
        icon={Building2}
        variant="view"
        maxWidth="!max-w-[85vw]"
      >
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center space-y-4 p-20"
          >
            <div className="relative">
              <Loader2 className="h-14 w-14 animate-spin text-[var(--brand-600)]" />
              <div className="absolute inset-0 h-14 w-14 animate-ping rounded-full bg-[var(--brand-400)] opacity-20" />
            </div>
            <p className="text-sm font-medium text-slate-600">{t('loading.default')}</p>
          </motion.div>
        ) : contracts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center space-y-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-20"
          >
            <div className="rounded-full bg-slate-100 p-6">
              <FileText className="h-12 w-12 text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-700">{t('empty.contracts.empty')}</p>
              <p className="mt-1 text-sm text-slate-500">{t('empty.contracts.customer_desc')}</p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Tổng hợp đồng</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{contracts.length}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--brand-50)] p-2">
                    <FileText className="h-5 w-5 text-[var(--brand-600)]" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-emerald-700">Đang hoạt động</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-900">
                      {statusCounts.ACTIVE || 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald-100 p-2">
                    <FileText className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-amber-700">Chờ xử lý</p>
                    <p className="mt-1 text-2xl font-bold text-amber-900">
                      {statusCounts.PENDING || 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-100 p-2">
                    <FileText className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-red-50 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-rose-700">Hết hạn</p>
                    <p className="mt-1 text-2xl font-bold text-rose-900">
                      {statusCounts.EXPIRED || 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-rose-100 p-2">
                    <FileText className="h-5 w-5 text-rose-600" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Search and Filter Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm theo mã hợp đồng..."
                    className="pl-9"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    'gap-2 transition-colors',
                    hasActiveFilters && 'border-sky-300 bg-sky-50 text-sky-700'
                  )}
                >
                  <Filter className="h-4 w-4" />
                  Bộ lọc
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                      !
                    </Badge>
                  )}
                </Button>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="gap-2 text-slate-600"
                  >
                    <X className="h-4 w-4" />
                    Xóa bộ lọc
                  </Button>
                )}
              </div>

              {/* Filter Panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-700">
                          Trạng thái
                        </label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none"
                        >
                          <option value="">Tất cả trạng thái</option>
                          <option value="PENDING">Chờ xử lý</option>
                          <option value="ACTIVE">Đang hoạt động</option>
                          <option value="EXPIRED">Hết hạn</option>
                          <option value="TERMINATED">Đã chấm dứt</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-700">
                          Loại hợp đồng
                        </label>
                        <select
                          value={typeFilter}
                          onChange={(e) => setTypeFilter(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none"
                        >
                          <option value="">Tất cả loại</option>
                          <option value="MPS_CLICK_CHARGE">MPS Click Charge</option>
                          <option value="MPS_CONSUMABLE">MPS Consumable</option>
                          <option value="CMPS_CLICK_CHARGE">CMPS Click Charge</option>
                          <option value="CMPS_CONSUMABLE">CMPS Consumable</option>
                          <option value="PARTS_REPAIR_SERVICE">Parts & Repair</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Contracts Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="overflow-hidden rounded-xl border border-slate-200 shadow-lg"
            >
              {filteredContracts.length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-3 p-12">
                  <div className="rounded-full bg-slate-100 p-4">
                    <Search className="h-8 w-8 text-slate-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-slate-700">Không tìm thấy kết quả</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Thử điều chỉnh bộ lọc hoặc tìm kiếm khác
                    </p>
                  </div>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/50">
                    <tr>
                      <th className="w-12 px-4 py-3.5 text-center">
                        <div className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                          #
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-left">
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                          <FileText className="h-4 w-4" />
                          Mã hợp đồng
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-left">
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                          <Tag className="h-4 w-4" />
                          Loại
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-left">
                        <div className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                          Trạng thái
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-left">
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                          <Calendar className="h-4 w-4" />
                          Thời gian
                        </div>
                      </th>
                      <th className="w-12 px-4 py-3.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredContracts.map((contract, idx) => (
                      <motion.tr
                        key={contract.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={cn(
                          'group transition-all duration-200',
                          expandedRow === contract.id ? 'bg-sky-50/50' : 'hover:bg-slate-50/80'
                        )}
                      >
                        <td className="px-4 py-3.5 text-center text-sm text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="font-mono text-sm font-medium transition-colors group-hover:border-sky-300 group-hover:bg-sky-50"
                            >
                              {contract.contractNumber}
                            </Badge>
                            <Link href={`/system/contracts/${contract.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge
                            variant="outline"
                            className={cn('text-xs font-medium', getTypeColor(contract.type))}
                          >
                            {contract.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge
                            className={cn(
                              'border-0 text-xs font-medium text-white shadow-sm',
                              getStatusColor(contract.status)
                            )}
                          >
                            {getStatusLabel(contract.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>
                              {new Date(contract.startDate).toLocaleDateString('vi-VN')}
                              {' — '}
                              {new Date(contract.endDate).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {contract.description && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => toggleRowExpansion(contract.id)}
                            >
                              <motion.div
                                animate={{ rotate: expandedRow === contract.id ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </motion.div>
                            </Button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </motion.div>

            {/* Expanded Row Details */}
            <AnimatePresence>
              {expandedRow && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm"
                >
                  {(() => {
                    const contract = contracts.find((c) => c.id === expandedRow)
                    if (!contract) return null
                    return (
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-slate-700">
                          Mô tả hợp đồng
                        </h4>
                        <p className="text-sm text-slate-600">
                          {contract.description || 'Không có mô tả'}
                        </p>
                        {contract.documentUrl && (
                          <div className="mt-3">
                            <a
                              href={contract.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-sky-600 hover:text-sky-700"
                            >
                              <FileText className="h-4 w-4" />
                              Xem tài liệu hợp đồng
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Summary Footer */}
            {filteredContracts.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm"
              >
                <div className="flex items-center gap-2 text-slate-600">
                  <FileText className="h-4 w-4" />
                  <span>
                    Hiển thị{' '}
                    <span className="font-semibold text-slate-900">{filteredContracts.length}</span>
                    {filteredContracts.length !== contracts.length && (
                      <span> / {contracts.length}</span>
                    )}{' '}
                    hợp đồng
                  </span>
                </div>
                {hasActiveFilters && (
                  <Badge variant="outline" className="border-sky-300 bg-sky-50 text-sky-700">
                    Đang lọc
                  </Badge>
                )}
              </motion.div>
            )}
          </div>
        )}
      </SystemModalLayout>
    </Dialog>
  )
}
