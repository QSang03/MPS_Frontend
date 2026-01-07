'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { FileSpreadsheet, ArrowLeft, Download, Ban, Loader2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import { formatDate, formatNumber } from '@/lib/utils/formatters'
import { printPageReportsClientService } from '@/lib/api/services/print-page-reports-client.service'
import type { PrintPageReport, PrintPageReportStatus } from '@/types/models/print-page-report'
import { LoadingState } from '@/components/ui/LoadingState'
import { ActionGuard } from '@/components/shared/ActionGuard'
import Link from 'next/link'

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

function safeLowercase(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase() : ''
}

export function PrintPageReportDetail() {
  const { t } = useLocale()
  const params = useParams()
  const reportId = params.reportId as string

  const [report, setReport] = useState<PrintPageReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const fetchReport = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await printPageReportsClientService.getById(reportId)
      setReport(result)
    } catch (error) {
      console.error('Error fetching report:', error)
      toast.error(t('print_page_report.errors.load_failed'))
    } finally {
      setIsLoading(false)
    }
  }, [reportId, t])

  useEffect(() => {
    if (reportId) {
      fetchReport()
    }
  }, [reportId, fetchReport])

  const handleGenerateFiles = async () => {
    if (!report) return

    setIsExporting(true)
    try {
      const result = await printPageReportsClientService.exportXlsx({
        reportId: report.id,
        customerId: report.customerId,
      })
      if (result?.xlsxUrl || result?.pdfUrl) {
        toast.success(t('print_page_report.generate_success'))
        // Refresh to get updated xlsxUrl/pdfUrl
        fetchReport()
      } else {
        toast.error(t('print_page_report.errors.export_failed'))
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error(t('print_page_report.errors.export_failed'))
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return <LoadingState />
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileSpreadsheet className="text-muted-foreground mb-4 h-12 w-12" />
        <h2 className="text-lg font-semibold">{t('print_page_report.not_found.title')}</h2>
        <p className="text-muted-foreground mb-4">{t('print_page_report.not_found.description')}</p>
        <Button variant="outline" asChild>
          <Link href="/user/reports/print-page">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('print_page_report.back_to_list')}
          </Link>
        </Button>
      </div>
    )
  }

  const statusKey = safeLowercase((report as unknown as { status?: unknown })?.status)
  const reportNumber = (report as unknown as { reportNumber?: unknown })?.reportNumber
  const customerName = (report as unknown as { customerName?: unknown })?.customerName
  const statusValue = (report as unknown as { status?: PrintPageReportStatus })?.status

  return (
    <div className="space-y-6">
      {/* Back Button and Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/user/reports/print-page">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('print_page_report.back_to_list')}
          </Link>
        </Button>
        <div className="flex gap-2">
          <ActionGuard pageId="print-page-report" actionId="export-print-page-report">
            {report.xlsxUrl && (
              <Button variant="outline" asChild>
                <a href={report.xlsxUrl} target="_blank" rel="noopener noreferrer">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  {t('print_page_report.actions.download_xlsx')}
                </a>
              </Button>
            )}
          </ActionGuard>
          <ActionGuard pageId="print-page-report" actionId="export-print-page-report">
            {report.pdfUrl && (
              <Button variant="outline" asChild>
                <a href={report.pdfUrl} target="_blank" rel="noopener noreferrer">
                  <FileText className="mr-2 h-4 w-4" />
                  {t('print_page_report.actions.view_pdf')}
                </a>
              </Button>
            )}
          </ActionGuard>
          <ActionGuard pageId="print-page-report" actionId="export-print-page-report">
            {report.status !== 'VOID' && (!report.xlsxUrl || !report.pdfUrl) && (
              <Button onClick={handleGenerateFiles} disabled={isExporting}>
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('print_page_report.exporting')}
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    {t('print_page_report.actions.generate_report_files')}
                  </>
                )}
              </Button>
            )}
          </ActionGuard>
          <ActionGuard pageId="print-page-report" actionId="void-print-page-report">
            {report.status === 'DRAFT' && (
              <Button variant="destructive">
                <Ban className="mr-2 h-4 w-4" />
                {t('print_page_report.actions.void')}
              </Button>
            )}
          </ActionGuard>
        </div>
      </div>

      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">
                {typeof reportNumber === 'string' ? reportNumber : '-'}
              </CardTitle>
              <CardDescription>
                {typeof customerName === 'string' ? customerName : '-'}
              </CardDescription>
            </div>
            {statusValue ? (
              <Badge variant={getStatusBadgeVariant(statusValue)}>
                {t(`print_page_report.status.${statusKey}`)}
              </Badge>
            ) : (
              <Badge variant="secondary">-</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div>
              <p className="text-muted-foreground text-sm">
                {t('print_page_report.fields.period')}
              </p>
              <p className="font-medium">
                {report.periodLabel ||
                  `${formatDate(report.periodStart, 'dd/MM/yyyy')} - ${formatDate(report.periodEnd, 'dd/MM/yyyy')}`}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                {t('print_page_report.fields.billing_day')}
              </p>
              <p className="font-medium">{report.billingDay || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                {t('print_page_report.fields.total_bw_pages')}
              </p>
              <p className="font-mono text-xl font-medium">{formatNumber(report.totalBwPagesA4)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                {t('print_page_report.fields.total_color_pages')}
              </p>
              <p className="font-mono text-xl font-medium">
                {formatNumber(report.totalColorPagesA4)}
              </p>
            </div>
          </div>

          {report.customerAddress && (
            <div className="mt-6 border-t pt-4">
              <p className="text-muted-foreground text-sm">
                {t('print_page_report.fields.address')}
              </p>
              <p className="text-sm">{report.customerAddress}</p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-6 text-sm md:grid-cols-4">
            <div>
              <p className="text-muted-foreground">
                {t('print_page_report.fields.generated_date')}
              </p>
              <p>
                {report.generatedDate ? formatDate(report.generatedDate, 'dd/MM/yyyy HH:mm') : '-'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('print_page_report.fields.created_at')}</p>
              <p>{formatDate(report.createdAt, 'dd/MM/yyyy HH:mm')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items Table */}
      {report.lineItems && report.lineItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('print_page_report.line_items_title')}</CardTitle>
            <CardDescription>
              {t('print_page_report.line_items_count', { count: report.lineItems.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">{t('print_page_report.table.stt')}</TableHead>
                    <TableHead>{t('print_page_report.table.device_model')}</TableHead>
                    <TableHead>{t('print_page_report.table.serial_number')}</TableHead>
                    <TableHead>{t('print_page_report.table.location')}</TableHead>
                    <TableHead className="text-right">
                      {t('print_page_report.table.bw_old')}
                    </TableHead>
                    <TableHead className="text-right">
                      {t('print_page_report.table.bw_new')}
                    </TableHead>
                    <TableHead className="bg-muted/50 text-right">
                      {t('print_page_report.table.bw_used')}
                    </TableHead>
                    <TableHead className="text-right">
                      {t('print_page_report.table.color_old')}
                    </TableHead>
                    <TableHead className="text-right">
                      {t('print_page_report.table.color_new')}
                    </TableHead>
                    <TableHead className="bg-muted/50 text-right">
                      {t('print_page_report.table.color_used')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.lineItems.map((item) => (
                    <TableRow key={item.deviceId}>
                      <TableCell className="font-medium">{item.stt}</TableCell>
                      <TableCell>{item.deviceModel}</TableCell>
                      <TableCell className="font-mono text-sm">{item.serialNumber}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={item.location}>
                        {item.location}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(item.bwOldA4)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(item.bwNewA4)}
                      </TableCell>
                      <TableCell className="bg-muted/50 text-right font-mono font-semibold">
                        {formatNumber(item.bwUsedA4)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(item.colorOldA4)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(item.colorNewA4)}
                      </TableCell>
                      <TableCell className="bg-muted/50 text-right font-mono font-semibold">
                        {formatNumber(item.colorUsedA4)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="bg-muted/30 font-bold">
                    <TableCell colSpan={6} className="text-right">
                      {t('print_page_report.total')}
                    </TableCell>
                    <TableCell className="bg-muted text-right font-mono">
                      {formatNumber(report.totalBwPagesA4)}
                    </TableCell>
                    <TableCell colSpan={2}></TableCell>
                    <TableCell className="bg-muted text-right font-mono">
                      {formatNumber(report.totalColorPagesA4)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {report.notes && (
        <Card>
          <CardHeader>
            <CardTitle>{t('print_page_report.fields.notes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">{report.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
