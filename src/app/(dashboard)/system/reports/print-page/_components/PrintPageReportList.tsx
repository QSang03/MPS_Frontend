'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileSpreadsheet, Plus, RefreshCw, Eye, Download, Ban, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import { formatDate, formatNumber } from '@/lib/utils/formatters'
import { printPageReportsClientService } from '@/lib/api/services/print-page-reports-client.service'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import type {
  PrintPageReportListItem,
  PrintPageReportStatus,
} from '@/types/models/print-page-report'
import type { Customer } from '@/types/models/customer'
import type { ListPagination } from '@/types/api'
import { MonthPicker } from '@/components/ui/month-picker'
import { PrintPageReportGenerateDialog } from './PrintPageReportGenerateDialog'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'

const STATUS_OPTIONS: { value: PrintPageReportStatus | 'all'; labelKey: string }[] = [
  { value: 'all', labelKey: 'print_page_report.status.all' },
  { value: 'DRAFT', labelKey: 'print_page_report.status.draft' },
  { value: 'GENERATED', labelKey: 'print_page_report.status.generated' },
  { value: 'VOID', labelKey: 'print_page_report.status.void' },
]

function getStatusBadgeVariant(status: PrintPageReportStatus) {
  switch (status) {
    case 'DRAFT':
      return 'outline'
    case 'GENERATED':
      return 'default'
    case 'VOID':
      return 'destructive'
    default:
      return 'secondary'
  }
}

export function PrintPageReportList() {
  const { t, locale } = useLocale()

  const [reports, setReports] = useState<PrintPageReportListItem[]>([])
  const [pagination, setPagination] = useState<ListPagination | undefined>()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PrintPageReportStatus | 'all'>('all')
  const [customerFilter, setCustomerFilter] = useState<string>('all')
  const [monthFilter, setMonthFilter] = useState<string | undefined>()
  const [page, setPage] = useState(1)

  const fetchReports = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await printPageReportsClientService.getAll({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        customerId: customerFilter !== 'all' ? customerFilter : undefined,
        month: monthFilter || undefined,
        lang: locale as 'vi' | 'en',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      setReports(result.data)
      setPagination(result.pagination)
    } catch (error) {
      console.error('Error fetching print page reports:', error)
      toast.error(t('print_page_report.errors.load_failed'))
    } finally {
      setIsLoading(false)
    }
  }, [page, search, statusFilter, customerFilter, monthFilter, locale, t])

  const fetchCustomers = useCallback(async () => {
    try {
      const result = await customersClientService.getAll({ limit: 100 })
      setCustomers(result.data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleExportXlsx = async (report: PrintPageReportListItem) => {
    try {
      const result = await printPageReportsClientService.exportXlsx({
        reportId: report.id,
        customerId: report.customerId,
      })
      if (result?.xlsxUrl) {
        window.open(result.xlsxUrl, '_blank')
        toast.success(t('print_page_report.export_success'))
      } else {
        toast.error(t('print_page_report.errors.export_failed'))
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error(t('print_page_report.errors.export_failed'))
    }
  }

  const handleRefresh = () => {
    setPage(1)
    fetchReports()
  }

  const handleGenerateSuccess = () => {
    setIsGenerateOpen(false)
    handleRefresh()
  }

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">{t('filters.general')}</CardTitle>
          <CardDescription>{t('print_page_report.filters.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative min-w-[200px] flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder={t('print_page_report.filters.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={customerFilter}
              onValueChange={(val) => {
                setCustomerFilter(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('placeholder.all_customers')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('placeholder.all_customers')}</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val as PrintPageReportStatus | 'all')
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('placeholder.all_statuses')} />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <MonthPicker
              value={monthFilter}
              onChange={(date) => {
                setMonthFilter(date)
                setPage(1)
              }}
              placeholder={t('print_page_report.filters.select_month')}
            />

            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('button.refresh')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions and Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>{t('print_page_report.list_title')}</CardTitle>
            <CardDescription>
              {pagination?.total
                ? t('print_page_report.list_count', { count: pagination.total })
                : t('print_page_report.list_subtitle')}
            </CardDescription>
          </div>
          <Button onClick={() => setIsGenerateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('print_page_report.generate_report')}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState />
          ) : reports.length === 0 ? (
            <EmptyState
              icon={FileSpreadsheet}
              title={t('print_page_report.empty.title')}
              description={t('print_page_report.empty.description')}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('print_page_report.table.report_number')}</TableHead>
                    <TableHead>{t('print_page_report.table.customer')}</TableHead>
                    <TableHead>{t('print_page_report.table.period')}</TableHead>
                    <TableHead className="text-right">
                      {t('print_page_report.table.bw_pages')}
                    </TableHead>
                    <TableHead className="text-right">
                      {t('print_page_report.table.color_pages')}
                    </TableHead>
                    <TableHead>{t('print_page_report.table.status')}</TableHead>
                    <TableHead>{t('print_page_report.table.created_at')}</TableHead>
                    <TableHead className="text-right">
                      {t('print_page_report.table.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.reportNumber}</TableCell>
                      <TableCell>{report.customerName}</TableCell>
                      <TableCell>
                        {formatDate(report.periodStart, 'dd/MM/yyyy')} -{' '}
                        {formatDate(report.periodEnd, 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(report.totalBwPagesA4)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(report.totalColorPagesA4)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(report.status)}>
                          {t(`print_page_report.status.${report.status.toLowerCase()}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(report.createdAt, 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              •••
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/system/reports/print-page/${report.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t('print_page_report.actions.view_detail')}
                              </Link>
                            </DropdownMenuItem>
                            {report.status !== 'VOID' && (
                              <DropdownMenuItem onClick={() => handleExportXlsx(report)}>
                                <Download className="mr-2 h-4 w-4" />
                                {t('print_page_report.actions.export_xlsx')}
                              </DropdownMenuItem>
                            )}
                            {report.xlsxUrl && (
                              <DropdownMenuItem asChild>
                                <a href={report.xlsxUrl} target="_blank" rel="noopener noreferrer">
                                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                                  {t('print_page_report.actions.download_xlsx')}
                                </a>
                              </DropdownMenuItem>
                            )}
                            {report.status === 'DRAFT' && (
                              <DropdownMenuItem className="text-destructive">
                                <Ban className="mr-2 h-4 w-4" />
                                {t('print_page_report.actions.void')}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-muted-foreground text-sm">
                    {t('print_page_report.pagination.showing', {
                      from: (page - 1) * 20 + 1,
                      to: Math.min(page * 20, pagination.total),
                      total: pagination.total,
                    })}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      {t('print_page_report.pagination.previous')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      {t('print_page_report.pagination.next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Generate Dialog */}
      <PrintPageReportGenerateDialog
        open={isGenerateOpen}
        onOpenChange={setIsGenerateOpen}
        customers={customers}
        onSuccess={handleGenerateSuccess}
      />
    </div>
  )
}
