'use client'

import { useMemo } from 'react'
import type { Session } from '@/lib/auth/session'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime, formatCurrency } from '@/lib/utils/formatters'
import { warehouseDocumentsClientService } from '@/lib/api/services/warehouse-documents-client.service'
import type { WarehouseDocument } from '@/types/models'
import { ArrowLeft } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

interface Props {
  id: string
  session?: Session | null
}

export default function WarehouseDocumentDetailClient({ id }: Props) {
  const { data, isLoading } = useQuery<WarehouseDocument | null>({
    queryKey: ['warehouse-documents', 'detail', id],
    queryFn: () => warehouseDocumentsClientService.getById(id),
  })
  const detail = useMemo(() => data ?? null, [data])

  // User-side: updates (confirm/cancel) are disabled for users

  const { t } = useLocale()

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="bg-muted h-8 w-1/4 animate-pulse rounded" />
        <div className="bg-muted h-48 animate-pulse rounded" />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="text-muted-foreground flex h-[50vh] items-center justify-center">
        {t('warehouse_document.not_found')}
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 p-4 pb-20 md:p-6">
      <div className="flex items-center justify-between border-b pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/user/warehouse-documents">
                <ArrowLeft className="mr-1 h-4 w-4" /> {t('common.back')}
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{detail.documentNumber}</h1>
          <div className="text-muted-foreground flex items-center gap-3 text-sm">
            <span className="text-xs">Loại: {detail.type}</span>
            <span>•</span>
            <span className="text-xs">Trạng thái: {detail.status}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Update actions disabled for user; only view allowed */}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('warehouse_document.info_title')}</CardTitle>
              <CardDescription>{t('warehouse_document.info_description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-sm">
                    {t('warehouse_document.field.document_number')}
                  </p>
                  <div className="font-medium">{detail.documentNumber}</div>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    {t('warehouse_document.field.created_at')}
                  </p>
                  <div className="font-medium">{formatDateTime(detail.createdAt ?? '')}</div>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    {t('warehouse_document.field.customer')}
                  </p>
                  <div className="font-medium">{detail.customer?.name ?? '-'}</div>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    {t('warehouse_document.field.supplier')}
                  </p>
                  <div className="font-medium">{detail.supplierName ?? '-'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('warehouse_document.items.title')}</CardTitle>
              <CardDescription>{t('warehouse_document.items.description')}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {detail.items && detail.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('warehouse_document.table.name')}</TableHead>
                        <TableHead>{t('warehouse_document.table.qty')}</TableHead>
                        <TableHead className="text-right">
                          {t('warehouse_document.table.unit_price')}
                        </TableHead>
                        <TableHead className="text-right">
                          {t('warehouse_document.table.total')}
                        </TableHead>
                        <TableHead>{t('warehouse_document.table.notes')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.items.map((item) => (
                        <TableRow key={item.id ?? `${item.consumableTypeId}-${item.quantity}`}>
                          <TableCell>
                            <div className="font-medium">{item.consumableType?.name ?? '-'}</div>
                            <div className="text-muted-foreground text-xs">
                              {item.consumableType?.partNumber ?? ''}
                            </div>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {item.unitPrice !== undefined && item.unitPrice !== null
                              ? formatCurrency(item.unitPrice, item.currency?.code || item.currency)
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.totalPrice !== undefined && item.totalPrice !== null
                              ? formatCurrency(
                                  item.totalPrice,
                                  item.currency?.code || item.currency
                                )
                              : '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate text-xs">
                            {item.notes ?? '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-muted-foreground flex flex-col items-center justify-center border-t py-12 text-sm">
                  {t('warehouse_document.items.empty')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('warehouse_document.related.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <p className="text-muted-foreground text-xs">
                  {t('warehouse_document.related.field.related_to')}
                </p>
                <div className="font-medium">{detail.purchaseRequest?.title ?? '-'}</div>
                {detail.purchaseRequest && (
                  <div className="text-muted-foreground text-xs">
                    ID:{' '}
                    {detail.purchaseRequest.requestNumber ??
                      `#${detail.purchaseRequest.id.slice(0, 8)}`}
                  </div>
                )}
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground text-xs">
                  {t('warehouse_document.notes_label')}
                </p>
                <div className="font-medium">{detail.notes ?? '-'}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
