'use client'

import { useEffect, useState } from 'react'
import type { Device } from '@/types/models/device'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import DeviceFormModal from './deviceformmodal'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import { toast } from 'sonner'
import {
  Monitor,
  Search,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Package,
  BarChart3,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export default function DevicesPageClient() {
  const [devices, setDevices] = useState<Device[]>([])
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  const fetchDevices = async () => {
    setLoading(true)
    try {
      const res = await devicesClientService.getAll({ page: 1, limit: 100 })
      setDevices(res.data || [])
      setFilteredDevices(res.data || [])
    } catch (err) {
      console.error('fetch devices error', err)
      toast.error('Không thể tải danh sách thiết bị')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  // Filter devices based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDevices(devices)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = devices.filter((d) => {
      return (
        d.serialNumber?.toLowerCase().includes(term) ||
        d.location?.toLowerCase().includes(term) ||
        d.deviceModel?.name?.toLowerCase().includes(term) ||
        d.ipAddress?.toLowerCase().includes(term)
      )
    })
    setFilteredDevices(filtered)
  }, [searchTerm, devices])

  const activeCount = devices.filter((d) => d.isActive).length
  const inactiveCount = devices.length - activeCount

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Monitor className="h-10 w-10" />
              <div>
                <h1 className="text-2xl font-bold">Danh sách thiết bị</h1>
                <p className="mt-1 text-white/90">Quản lý tất cả thiết bị trong hệ thống</p>
              </div>
            </div>
          </div>

          <DeviceFormModal
            mode="create"
            onSaved={() => {
              toast.success('Tạo thiết bị thành công')
              fetchDevices()
            }}
          />
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-2">
                <Monitor className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-white/80">Tổng thiết bị</p>
                <p className="text-2xl font-bold">{devices.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/20 p-2">
                <CheckCircle2 className="h-5 w-5 text-green-300" />
              </div>
              <div>
                <p className="text-sm text-white/80">Hoạt động</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-500/20 p-2">
                <AlertCircle className="h-5 w-5 text-gray-300" />
              </div>
              <div>
                <p className="text-sm text-white/80">Không hoạt động</p>
                <p className="text-2xl font-bold">{inactiveCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Danh sách thiết bị
              </CardTitle>
              <CardDescription className="mt-1">
                Quản lý và theo dõi tất cả thiết bị
              </CardDescription>
            </div>

            {/* Search */}
            {devices.length > 0 && (
              <div className="relative w-64">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-cyan-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-blue-600" />
                      Serial
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-cyan-600" />
                      Model
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-rose-600" />
                      Khách hàng
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-teal-600" />
                      Vị trí
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredDevices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="text-muted-foreground flex flex-col items-center gap-3">
                        {searchTerm ? (
                          <>
                            <Search className="h-12 w-12 opacity-20" />
                            <p>Không tìm thấy thiết bị phù hợp với "{searchTerm}"</p>
                          </>
                        ) : (
                          <>
                            <Monitor className="h-12 w-12 opacity-20" />
                            <p>Chưa có thiết bị nào</p>
                            <DeviceFormModal
                              mode="create"
                              onSaved={() => {
                                toast.success('Tạo thiết bị thành công')
                                fetchDevices()
                              }}
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDevices.map((d, idx) => (
                    <tr
                      key={d.id}
                      className="transition-colors hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-cyan-50/50"
                    >
                      <td className="text-muted-foreground px-4 py-3 text-sm">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <code
                          role="button"
                          title="Xem chi tiết"
                          onClick={() => router.push(`/customer-admin/devices/${d.id}`)}
                          className="cursor-pointer rounded bg-blue-100 px-2 py-1 text-sm font-semibold text-blue-700"
                        >
                          {d.serialNumber || '—'}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {d.deviceModel?.name || d.deviceModelId || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {(d as unknown as { customer?: { name?: string } }).customer?.name ? (
                          <span className="text-sm font-medium">
                            {(d as unknown as { customer?: { name?: string } }).customer!.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {d.location ? (
                            <>
                              <MapPin className="text-muted-foreground h-3.5 w-3.5" />
                              {d.location}
                            </>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={d.isActive ? 'default' : 'secondary'}
                          className={cn(
                            'flex w-fit items-center gap-1.5',
                            d.isActive
                              ? 'bg-green-500 hover:bg-green-600'
                              : 'bg-gray-400 hover:bg-gray-500'
                          )}
                        >
                          {d.isActive ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {d.isActive ? 'Hoạt động' : 'Tạm dừng'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <DeviceFormModal
                            mode="edit"
                            device={d}
                            onSaved={() => {
                              toast.success('Cập nhật thiết bị thành công')
                              fetchDevices()
                            }}
                          />

                          <DeleteDialog
                            title={`Xóa thiết bị ${d.serialNumber || d.id}`}
                            description={`Bạn có chắc muốn xóa thiết bị ${d.serialNumber || d.id}?`}
                            onConfirm={async () => {
                              try {
                                await devicesClientService.delete(d.id)
                                toast.success('Xóa thiết bị thành công')
                                await fetchDevices()
                              } catch (err) {
                                console.error('delete device error', err)
                                toast.error('Có lỗi khi xóa thiết bị')
                              }
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Stats */}
          {filteredDevices.length > 0 && (
            <div className="text-muted-foreground mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>
                  Hiển thị{' '}
                  <span className="text-foreground font-semibold">{filteredDevices.length}</span>
                  {searchTerm && devices.length !== filteredDevices.length && (
                    <span> / {devices.length}</span>
                  )}{' '}
                  thiết bị
                </span>
              </div>

              {searchTerm && devices.length !== filteredDevices.length && (
                <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')} className="h-8">
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation: clicking serial opens device detail page */}
    </div>
  )
}
