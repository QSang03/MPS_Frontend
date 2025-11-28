'use client'

import { useMemo } from 'react'
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
import { formatDateTime } from '@/lib/utils/formatters'
import { warehouseDocumentsClientService } from '@/lib/api/services/warehouse-documents-client.service'
import type { WarehouseDocument } from '@/types/models'
import { ArrowLeft } from 'lucide-react'

interface Props {
  id: string
}

export default function WarehouseDocumentDetailClient({ id }: Props) {
  const { data, isLoading } = useQuery<WarehouseDocument | null>({
    queryKey: ['warehouse-documents', 'detail', id],
    queryFn: () => warehouseDocumentsClientService.getById(id),
  })
  const detail = useMemo(() => data ?? null, [data])

  // User-side: updates (confirm/cancel) are disabled for users

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
        Không tìm thấy chứng từ.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 p-4 pb-20 md:p-6">
      <div className="flex items-center justify-between border-b pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/user/warehouse-documents">
                <ArrowLeft className="mr-1 h-4 w-4" /> Quay lại
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
              <CardTitle>Thông tin chứng từ</CardTitle>
              <CardDescription>Thông tin chung của chứng từ kho</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-sm">Số chứng từ</p>
                  <div className="font-medium">{detail.documentNumber}</div>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Ngày tạo</p>
                  <div className="font-medium">{formatDateTime(detail.createdAt ?? '')}</div>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Khách hàng</p>
                  <div className="font-medium">{detail.customer?.name ?? '-'}</div>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Nhà cung cấp</p>
                  <div className="font-medium">{detail.supplierName ?? '-'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardDescription>Danh sách mặt hàng trong chứng từ</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {detail.items && detail.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên vật tư</TableHead>
                        <TableHead>SL</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                        <TableHead>Ghi chú</TableHead>
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
                          <TableCell className="text-right">{item.unitPrice ?? '-'}</TableCell>
                          <TableCell className="text-right">{item.totalPrice ?? '-'}</TableCell>
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
                  Không có item nào.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin liên quan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <p className="text-muted-foreground text-xs">Mang liên quan</p>
                <div className="font-medium">{detail.purchaseRequest?.title ?? '-'}</div>
                {detail.purchaseRequest && (
                  <div className="text-muted-foreground text-xs">
                    ID: {detail.purchaseRequest.id}
                  </div>
                )}
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground text-xs">Ghi chú</p>
                <div className="font-medium">{detail.notes ?? '-'}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
