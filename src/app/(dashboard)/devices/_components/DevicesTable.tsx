'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import { CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { DeviceFormModal } from './DeviceFormModal'
import { toast } from 'sonner'
import type { Device } from '@/types/models/device'
import { Skeleton } from '@/components/ui/skeleton'
// formatDate removed — not used in this table

export function DevicesTable() {
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10 })
  const queryClient = useQueryClient()

  const {
    data: devicesResp,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['devices', pagination.page, pagination.limit, search],
    queryFn: () =>
      devicesClientService.getAll({ page: pagination.page, limit: pagination.limit, search }),
  })

  const devices = devicesResp?.data || []
  const paginationInfo = devicesResp?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }

  useEffect(() => {
    // sync search debounce could be added; keeping simple
  }, [search])

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border-0 bg-white shadow-2xl">
        <div className="relative overflow-hidden border-0 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 p-0">
          <div className="relative flex items-center justify-between px-8 py-6">
            <div>
              <CardTitle className="text-2xl font-bold text-white">Thiết bị</CardTitle>
              <p className="mt-1 text-sm font-medium text-pink-100">Quản lý thiết bị</p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                placeholder="Tìm theo model hoặc serial"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <DeviceFormModal mode="create" />
              <Button variant="outline" size="icon" onClick={() => refetch()} title="Làm mới">
                ⟳
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="space-y-4 bg-gradient-to-b from-gray-50 to-white p-6">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : devices.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="mb-2 text-xl font-bold text-gray-700">Không có thiết bị</h3>
              <p className="mb-6 text-gray-500">Hãy tạo thiết bị mới</p>
              <DeviceFormModal mode="create" />
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-2xl border-2 border-gray-200 shadow-lg">
                <Table className="min-w-full">
                  <TableHeader className="border-b-2 border-gray-200 bg-gradient-to-r from-purple-100 via-pink-50 to-rose-50">
                    <TableRow>
                      <TableHead className="w-[60px] text-center font-bold text-gray-700">
                        #
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">Serial</TableHead>
                      <TableHead className="font-bold text-gray-700">Model</TableHead>
                      <TableHead className="font-bold text-gray-700">Khách hàng</TableHead>
                      <TableHead className="font-bold text-gray-700">Vị trí</TableHead>
                      <TableHead className="font-bold text-gray-700">Trạng thái</TableHead>
                      <TableHead className="w-[120px] text-right font-bold text-gray-700">
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devices.map((d: Device, idx: number) => (
                      <TableRow key={d.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <TableCell className="text-center font-bold text-gray-600">
                          {(pagination.page - 1) * pagination.limit + idx + 1}
                        </TableCell>
                        <TableCell>{d.serialNumber}</TableCell>
                        <TableCell>{d.model}</TableCell>
                        <TableCell>{d.customerId}</TableCell>
                        <TableCell>{d.location}</TableCell>
                        <TableCell>{d.status}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <DeviceFormModal mode="edit" device={d} />
                            <DeleteDialog
                              title="Xóa thiết bị"
                              description={`Bạn có chắc chắn muốn xóa thiết bị "${d.serialNumber}" không?`}
                              onConfirm={async () => {
                                try {
                                  await devicesClientService.delete(d.id)
                                  await queryClient.invalidateQueries({ queryKey: ['devices'] })
                                  toast.success('Đã xóa thiết bị')
                                } catch (err) {
                                  console.error('Delete device error', err)
                                  toast.error('Xảy ra lỗi khi xóa')
                                }
                              }}
                              trigger={
                                <Button variant="ghost" size="sm">
                                  Xóa
                                </Button>
                              }
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination simple controls */}
              <div className="flex items-center justify-between rounded-2xl p-4">
                <div className="text-sm text-gray-600">
                  Hiển thị {devices.length} / {paginationInfo.total || devices.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                    disabled={pagination.page <= 1}
                  >
                    ← Trước
                  </Button>
                  <div className="px-4 py-2 font-bold">
                    {pagination.page} / {paginationInfo.totalPages || 1}
                  </div>
                  <Button
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page >= (paginationInfo.totalPages || 1)}
                  >
                    Sau →
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </div>
    </div>
  )
}
