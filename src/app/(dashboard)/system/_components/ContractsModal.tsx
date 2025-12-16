'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileText, Search, Building2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import internalApiClient from '@/lib/api/internal-client'
import { useLocale } from '@/components/providers/LocaleProvider'

interface ContractsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  canViewContractDetail?: boolean
}

interface Contract {
  id: string
  customerId: string
  contractNumber: string
  type: string
  status: string
  startDate: string
  endDate: string
  description?: string
  documentUrl?: string
  createdAt: string
  updatedAt: string
  customer: {
    id: string
    name: string
    code: string
    contactEmail?: string
    contactPhone?: string
    tier?: string
    isActive: boolean
  }
}

interface ContractsResponse {
  data: Contract[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  ACTIVE: 'bg-green-100 text-green-700 border-green-300',
  EXPIRED: 'bg-gray-100 text-gray-700 border-gray-300',
  TERMINATED: 'bg-red-100 text-red-700 border-red-300',
}

export function ContractsModal({
  open,
  onOpenChange,
  onOpenContractDetail,
  canViewContractDetail = false,
}: ContractsModalProps & { onOpenContractDetail?: (id: string) => void }) {
  const { t, locale } = useLocale()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const limit = 10

  // Fetch contracts
  const { data: contractsData, isLoading } = useQuery({
    queryKey: ['contracts-modal', page, search, statusFilter, typeFilter],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page,
        limit,
      }
      if (search) params.search = search
      if (statusFilter !== 'all') params.status = statusFilter
      if (typeFilter !== 'all') params.type = typeFilter

      const response = await internalApiClient.get<ContractsResponse>('/api/contracts', { params })
      return response.data
    },
    enabled: open,
  })

  const contracts = contractsData?.data || []
  const pagination = contractsData?.pagination

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    setPage(1)
  }

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value)
    setPage(1)
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')
    } catch {
      return dateString
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SystemModalLayout
        title={t('dashboard.contracts.title')}
        description={t('dashboard.contracts.description')}
        icon={FileText}
        variant="view"
        maxWidth="!max-w-[60vw]"
        className="!max-h-[85vh]"
      >
        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={t('dashboard.contracts.search_placeholder')}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t('dashboard.contracts.filter_status_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('dashboard.contracts.status_all')}</SelectItem>
              <SelectItem value="PENDING">{t('contracts.status.PENDING')}</SelectItem>
              <SelectItem value="ACTIVE">{t('contracts.status.ACTIVE')}</SelectItem>
              <SelectItem value="EXPIRED">{t('contracts.status.EXPIRED')}</SelectItem>
              <SelectItem value="TERMINATED">{t('contracts.status.TERMINATED')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={handleTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t('dashboard.contracts.filter_type_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('dashboard.contracts.type_all')}</SelectItem>
              <SelectItem value="MPS_CLICK_CHARGE">
                {t('contracts.type.MPS_CLICK_CHARGE')}
              </SelectItem>
              <SelectItem value="MPS_CONSUMABLE">{t('contracts.type.MPS_CONSUMABLE')}</SelectItem>
              <SelectItem value="CMPS_CLICK_CHARGE">
                {t('contracts.type.CMPS_CLICK_CHARGE')}
              </SelectItem>
              <SelectItem value="CMPS_CONSUMABLE">{t('contracts.type.CMPS_CONSUMABLE')}</SelectItem>
              <SelectItem value="PARTS_REPAIR_SERVICE">
                {t('contracts.type.PARTS_REPAIR_SERVICE')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contracts List */}
        <div className="mt-6 space-y-3">
          {isLoading ? (
            [...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
          ) : contracts.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-gray-500">
              <div className="text-center">
                <FileText className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                <p>{t('dashboard.contracts.empty')}</p>
              </div>
            </div>
          ) : (
            contracts.map((contract, index) => (
              <motion.div
                key={contract.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'group rounded-lg border-2 border-gray-200 bg-white p-4 transition-all',
                  canViewContractDetail
                    ? 'cursor-pointer hover:border-[var(--brand-300)] hover:shadow-lg'
                    : 'cursor-not-allowed opacity-60'
                )}
                onClick={() => {
                  if (canViewContractDetail && typeof onOpenContractDetail === 'function') {
                    onOpenContractDetail(contract.id)
                  }
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand-600)] to-[var(--brand-500)] text-white">
                    <FileText className="h-6 w-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{contract.contractNumber}</h3>
                          <Badge
                            className={cn(
                              'border',
                              STATUS_COLORS[contract.status] || 'bg-gray-100 text-gray-700'
                            )}
                          >
                            {t(`contracts.status.${contract.status}`) || contract.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {t(`contracts.type.${contract.type}`) || contract.type}
                        </p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium">{contract.customer.name}</span>
                      </div>
                      {contract.customer.tier && (
                        <Badge variant="outline" className="text-xs">
                          {contract.customer.tier}
                        </Badge>
                      )}
                    </div>

                    {/* Date Range */}
                    <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                      </span>
                    </div>

                    {/* Description */}
                    {contract.description && (
                      <p className="mt-2 line-clamp-2 text-xs text-gray-500">
                        {contract.description}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <div className="text-sm text-gray-600">
              {t('dashboard.contracts.showing', {
                from: (pagination.page - 1) * pagination.limit + 1,
                to: Math.min(pagination.page * pagination.limit, pagination.total),
                total: pagination.total,
              })}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                {t('pagination.prev')}
              </Button>
              <span className="text-sm text-gray-600">
                {t('pagination.page_of', {
                  page: pagination.page,
                  totalPages: pagination.totalPages,
                })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
              >
                {t('pagination.next')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        {/* Contract Detail is opened by parent page to allow closing this modal while detail is open */}
      </SystemModalLayout>
    </Dialog>
  )
}
