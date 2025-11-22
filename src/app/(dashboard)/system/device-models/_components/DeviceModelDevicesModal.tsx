'use client'
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import type { Device } from '@/types/models'
import {
  Loader2,
  Monitor,
  Search,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Eye,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface DeviceModelDevicesModalProps {
  deviceModelId: string
  deviceModelName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function DeviceModelDevicesModal({
  deviceModelId,
  deviceModelName,
  open,
  onOpenChange,
}: DeviceModelDevicesModalProps) {
  const [devices, setDevices] = useState<Device[]>([])
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const resp = await devicesClientService.getAll({
        page: 1,
        limit: 100,
        deviceModelId,
      })
      setDevices(resp.data || [])
      setFilteredDevices(resp.data || [])
    } catch (err: any) {
      console.error('Load devices for model failed', err)
      toast.error('Không thể tải danh sách thiết bị cho model này')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) load()
  }, [open])

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
        d.ipAddress?.toLowerCase().includes(term)
      )
    })
    setFilteredDevices(filtered)
  }, [searchTerm, devices])

  const activeCount = devices.filter((d) => d.isActive).length
  const inactiveCount = devices.length - activeCount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SystemModalLayout
        title="Thiết bị thuộc model"
        description={`Danh sách thiết bị thuộc model: ${deviceModelName}`}
        icon={Monitor}
        variant="view"
        maxWidth="!max-w-[75vw]"
      >
        {/* Quick Stats */}
        <div className="mb-4 grid grid-cols-3 gap-3 rounded-lg border border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-4">
          <div className="rounded-lg border border-blue-200 bg-white p-2.5">
            <p className="text-xs text-gray-600">Tổng thiết bị</p>
            <p className="mt-1 text-xl font-bold text-blue-600">{devices.length}</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-white p-2.5">
            <p className="text-xs text-gray-600">Hoạt động</p>
            <p className="mt-1 text-xl font-bold text-green-600">{activeCount}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-2.5">
            <p className="text-xs text-gray-600">Tạm dừng</p>
            <p className="mt-1 text-xl font-bold text-gray-600">{inactiveCount}</p>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-600" />
              <p className="text-muted-foreground">Đang tải...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search Input */}
              {devices.length > 0 && (
                <div className="relative mb-4">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder="Tìm kiếm theo serial, vị trí, IP..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              )}

              {/* Table */}
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
                      <th className="px-4 py-3 text-left text-sm font-semibold">Model</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-cyan-600" />
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
                        <td colSpan={6} className="px-4 py-12 text-center">
                          <div className="text-muted-foreground flex flex-col items-center gap-3">
                            {searchTerm ? (
                              <>
                                <Search className="h-12 w-12 opacity-20" />
                                <p>Không tìm thấy thiết bị phù hợp</p>
                              </>
                            ) : (
                              <>
                                <Monitor className="h-12 w-12 opacity-20" />
                                <p>Không tìm thấy thiết bị nào cho model này</p>
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
                            <Badge variant="outline" className="font-mono text-xs">
                              {d.serialNumber}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {d.model || d.deviceModel?.name || '—'}
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
                          <td className="px-4 py-3 text-right">
                            <Link href={`/system/devices/${d.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="transition-all hover:bg-gray-100 hover:text-gray-700"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer Stats */}
              {filteredDevices.length > 0 && (
                <div className="text-muted-foreground flex items-center justify-between border-t pt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>
                      Hiển thị{' '}
                      <span className="text-foreground font-semibold">
                        {filteredDevices.length}
                      </span>
                      {searchTerm && devices.length !== filteredDevices.length && (
                        <span> / {devices.length}</span>
                      )}{' '}
                      thiết bị
                    </span>
                  </div>

                  {searchTerm && devices.length !== filteredDevices.length && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchTerm('')}
                      className="h-8"
                    >
                      Xóa bộ lọc
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </SystemModalLayout>
    </Dialog>
  )
}
