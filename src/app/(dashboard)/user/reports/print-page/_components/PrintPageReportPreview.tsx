'use client'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useLocale } from '@/components/providers/LocaleProvider'
import { formatDate, formatNumber } from '@/lib/utils/formatters'
import type { PrintPageReport } from '@/types/models/print-page-report'

interface PrintPageReportPreviewProps {
  report: PrintPageReport
  onBack?: () => void
}

export function PrintPageReportPreview({ report, onBack }: PrintPageReportPreviewProps) {
  const { t } = useLocale()

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('print_page_report.back_to_form')}
        </Button>
      )}

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('print_page_report.preview_title')}</span>
            <Badge variant="outline">{t('print_page_report.status.preview')}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-muted-foreground text-sm">
                {t('print_page_report.fields.customer')}
              </p>
              <p className="font-medium">{report.customerName}</p>
            </div>
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
                {t('print_page_report.fields.total_bw_pages')}
              </p>
              <p className="font-mono text-lg font-medium">{formatNumber(report.totalBwPagesA4)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                {t('print_page_report.fields.total_color_pages')}
              </p>
              <p className="font-mono text-lg font-medium">
                {formatNumber(report.totalColorPagesA4)}
              </p>
            </div>
          </div>
          {report.customerAddress && (
            <div className="mt-4">
              <p className="text-muted-foreground text-sm">
                {t('print_page_report.fields.address')}
              </p>
              <p className="text-sm">{report.customerAddress}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line Items Table */}
      {report.lineItems && report.lineItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('print_page_report.line_items_title')}</CardTitle>
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
                    <TableHead className="text-right">
                      {t('print_page_report.table.bw_used')}
                    </TableHead>
                    <TableHead className="text-right">
                      {t('print_page_report.table.color_old')}
                    </TableHead>
                    <TableHead className="text-right">
                      {t('print_page_report.table.color_new')}
                    </TableHead>
                    <TableHead className="text-right">
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
                      <TableCell className="text-right font-mono font-medium">
                        {formatNumber(item.bwUsedA4)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(item.colorOldA4)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(item.colorNewA4)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatNumber(item.colorUsedA4)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Totals Row */}
            <div className="mt-4 flex justify-end">
              <div className="bg-muted/50 rounded-lg border p-4">
                <div className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2 sm:gap-x-8">
                  <span className="text-muted-foreground">
                    {t('print_page_report.total_bw_used')}:
                  </span>
                  <span className="text-right font-mono font-bold">
                    {formatNumber(report.totalBwPagesA4)}
                  </span>
                  <span className="text-muted-foreground">
                    {t('print_page_report.total_color_used')}:
                  </span>
                  <span className="text-right font-mono font-bold">
                    {formatNumber(report.totalColorPagesA4)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
