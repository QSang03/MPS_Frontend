'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Loader2,
  Receipt,
  FileText,
  Download,
  Eye,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { invoicesClientService } from '@/lib/api/services/invoices-client.service'
import type { InvoiceListItem, InvoiceStatus } from '@/types/models/invoice'
import { cn } from '@/lib/utils'
import { getPublicUrl } from '@/lib/utils/publicUrl'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ActionGuard } from '@/components/shared/ActionGuard'

interface InvoicesListProps {
  customerId: string
  contractId?: string
}

export function InvoicesList({ customerId, contractId }: InvoicesListProps) {
  const { t, locale } = useLocale()
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [pagination, setPagination] = useState<{
    page: number
    limit: number
    total: number
    totalPages: number
  } | null>(null)

  const formatDate = (value?: string | null) => {
    if (!value) return '—'
    return new Date(value).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const formatPrice = (value?: number | null, currencyCode?: string) => {
    if (value === undefined || value === null) return '—'
    return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: currencyCode || 'USD',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const getStatusColor = (status?: InvoiceStatus) => {
    switch (status) {
      case 'GENERATED':
        return 'bg-blue-500 hover:bg-blue-600 shadow-blue-200'
      case 'SENT':
        return 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
      case 'PAID':
        return 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
      case 'VOID':
        return 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'
      case 'DRAFT':
        return 'bg-slate-500 hover:bg-slate-600 shadow-slate-200'
      default:
        return 'bg-slate-500 hover:bg-slate-600 shadow-slate-200'
    }
  }

  const getStatusLabel = (status?: InvoiceStatus) => {
    if (!status) return '—'
    switch (status) {
      case 'DRAFT':
        return t('invoices.status.draft')
      case 'GENERATED':
        return t('invoices.status.generated')
      case 'SENT':
        return t('invoices.status.sent')
      case 'PAID':
        return t('invoices.status.paid')
      case 'VOID':
        return t('invoices.status.void')
      default:
        return status
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const loadInvoices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await invoicesClientService.getAll({
        page,
        limit,
        search: debouncedSearch || undefined,
        sortBy: 'billingDate',
        sortOrder: 'desc',
        customerId,
        contractId,
        status: statusFilter,
      })
      setInvoices(data.data)
      setPagination(data.pagination || null)
    } catch (err) {
      console.error('Load invoices failed', err)
      setInvoices([])
      setError(t('invoices.error.load_list'))
    } finally {
      setLoading(false)
    }
  }, [customerId, contractId, page, limit, debouncedSearch, statusFilter, t])

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  return (
    <Card className="border-slate-200 shadow-lg">
      <CardHeader className="space-y-4 border-b border-slate-100 bg-gradient-to-br from-white to-slate-50/50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2.5 text-2xl text-slate-900">
              <div className="rounded-lg bg-emerald-100 p-2">
                <Receipt className="h-5 w-5 text-emerald-600" />
              </div>
              {t('customer.detail.tab.invoices')}
            </CardTitle>
            <CardDescription className="mt-2">
              {t('customer.detail.invoices.description')}
            </CardDescription>
          </div>
        </div>

        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="relative">
            <FileText className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('invoices.search_placeholder')}
              className="pl-9"
            />
          </div>

          <select
            value={statusFilter ?? ''}
            onChange={(e) => {
              setStatusFilter(e.target.value ? e.target.value : undefined)
              setPage(1)
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
          >
            <option value="">{t('invoices.filter.all')}</option>
            <option value="DRAFT">{t('invoices.status.DRAFT')}</option>
            <option value="GENERATED">{t('invoices.status.GENERATED')}</option>
            <option value="SENT">{t('invoices.status.SENT')}</option>
            <option value="PAID">{t('invoices.status.PAID')}</option>
            <option value="VOID">{t('invoices.status.VOID')}</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="m-6 rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-red-50 p-6 text-sm text-rose-700"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">{t('invoices.error.title')}</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          </motion.div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
              <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-emerald-400 opacity-20" />
            </div>
            <p className="text-sm font-medium text-slate-600">{t('common.loading')}</p>
            <p className="text-sm font-medium text-slate-600">{t('invoices.loading')}</p>
          </div>
        ) : invoices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="m-6 flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 py-20 text-center"
          >
            <div className="rounded-full bg-slate-100 p-4">
              <Receipt className="h-10 w-10 text-slate-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-700">{t('invoices.empty.title')}</p>
              <p className="mt-1 text-sm text-slate-500">{t('invoices.empty.description')}</p>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] table-auto">
                <thead className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/50">
                  <tr>
                    <th className="min-w-[180px] py-4 pr-4 pl-6 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
                      {t('invoices.table.number')}
                    </th>
                    <th className="min-w-[120px] px-4 py-4 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
                      {t('invoices.table.period')}
                    </th>
                    <th className="min-w-[120px] px-4 py-4 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
                      {t('invoices.table.billing_date')}
                    </th>
                    <th className="w-28 px-4 py-4 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
                      {t('invoices.table.status')}
                    </th>
                    <th className="w-32 px-4 py-4 text-right text-xs font-semibold tracking-wide text-slate-600 uppercase">
                      {t('invoices.table.total')}
                    </th>
                    <th className="w-32 px-4 py-4 text-right text-xs font-semibold tracking-wide text-slate-600 uppercase">
                      {t('invoices.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice, idx) => (
                    <motion.tr
                      key={invoice.invoiceId}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group border-b border-slate-100 transition-all duration-200 last:border-b-0 hover:bg-emerald-50/50"
                    >
                      <td className="py-4 pr-4 pl-6">
                        <div className="font-mono text-sm font-semibold text-slate-800">
                          {invoice.invoiceNumber}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {formatDate(invoice.periodStart)} — {formatDate(invoice.periodEnd)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {formatDate(invoice.billingDate)}
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          className={cn(
                            'border-0 text-xs font-medium text-white shadow-sm',
                            getStatusColor(invoice.status)
                          )}
                        >
                          {t(`invoices.status.${invoice.status ?? 'DRAFT'}`) ||
                            getStatusLabel(invoice.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-slate-800">
                        {formatPrice(invoice.totalAmount, invoice.currency)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <ActionGuard pageId="customers" actionId="invoice-view">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-8 w-8 cursor-pointer p-0"
                                  onClick={() => {
                                    // TODO: Open invoice detail modal
                                    console.log('View invoice:', invoice.invoiceId)
                                  }}
                                  aria-label={t('invoices.action.view')}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t('invoices.action.view')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </ActionGuard>
                          <ActionGuard pageId="customers" actionId="invoice-view">
                            {invoice.pdfUrl && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 w-8 cursor-pointer p-0"
                                    onClick={() => {
                                      // Normalize the PDF URL to use NEXT_PUBLIC_API_URL
                                      const pdf = getPublicUrl(invoice.pdfUrl)
                                      if (pdf) {
                                        window.open(pdf, '_blank')
                                      }
                                    }}
                                    aria-label={t('invoices.action.download_pdf')}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t('invoices.action.download_pdf')}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </ActionGuard>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                <div className="text-sm text-slate-600">
                  {t('pagination.showing_range', {
                    from: (pagination.page - 1) * pagination.limit + 1,
                    to: Math.min(pagination.page * pagination.limit, pagination.total),
                    total: pagination.total,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="cursor-pointer gap-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        {t('pagination.prev')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('pagination.prev')}</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="text-sm text-slate-600">
                    {t('pagination.page_of', {
                      page: pagination.page,
                      totalPages: pagination.totalPages,
                    })}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                        disabled={page === pagination.totalPages}
                        className="cursor-pointer gap-2"
                      >
                        {t('pagination.next')}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('pagination.next')}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
