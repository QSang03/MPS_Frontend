'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import { consumablesClientService } from '@/lib/api/services/consumables-client.service'
import { Loader2 } from 'lucide-react'
// import Table component removed because not used in this component
import Link from 'next/link'
import { contractsClientService } from '@/lib/api/services/contracts-client.service'
import type { Contract } from '@/types/models/contract'

type Props = {
  customerId: string
}

export default function CustomerDetailClient({ customerId }: Props) {
  const [devices, setDevices] = useState<Record<string, unknown>[]>([])
  const [consumables, setConsumables] = useState<Record<string, unknown>[]>([])
  const [loadingDevices, setLoadingDevices] = useState(true)
  const [loadingConsumables, setLoadingConsumables] = useState(true)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loadingContracts, setLoadingContracts] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoadingDevices(true)
        const res = await devicesClientService.getAll({ customerId, page: 1, limit: 50 })
        if (!mounted) return
        setDevices((res.data as unknown as Record<string, unknown>[]) ?? [])
      } catch (err: unknown) {
        console.error('Load devices for customer failed', err)
        setDevices([])
      } finally {
        setLoadingDevices(false)
      }
    })()
    ;(async () => {
      try {
        setLoadingConsumables(true)
        const res = await consumablesClientService.list({ customerId, page: 1, limit: 50 })
        // normalize response that might be either { items: [...] } or an array
        const payload = res as { items?: unknown[] } | unknown[]
        const items = Array.isArray((payload as { items?: unknown[] }).items)
          ? (payload as { items?: unknown[] }).items!
          : Array.isArray(payload)
            ? (payload as unknown[])
            : []
        if (!mounted) return
        setConsumables(items as Record<string, unknown>[])
      } catch (err: unknown) {
        console.error('Load consumables for customer failed', err)
        setConsumables([])
      } finally {
        setLoadingConsumables(false)
      }
    })()
    ;(async () => {
      try {
        setLoadingContracts(true)
        const res = await contractsClientService.getAll({ customerId, page: 1, limit: 50 })
        if (!mounted) return
        setContracts(res.data || [])
      } catch (err: unknown) {
        console.error('Load contracts for customer failed', err)
        setContracts([])
      } finally {
        setLoadingContracts(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [customerId])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Chi tiết khách hàng</h2>
        <Link href="/system/customers" className="text-muted-foreground text-sm">
          Quay lại danh sách
        </Link>
      </div>

      <Tabs defaultValue="devices">
        <TabsList className="mb-4 grid w-full grid-cols-3">
          <TabsTrigger value="devices">Thiết bị</TabsTrigger>
          <TabsTrigger value="consumables">Vật tư</TabsTrigger>
          <TabsTrigger value="contracts">Hợp đồng</TabsTrigger>
        </TabsList>

        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle>Thiết bị của khách hàng</CardTitle>
              <CardDescription>Danh sách thiết bị thuộc khách hàng này</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDevices ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : devices.length === 0 ? (
                <div className="text-muted-foreground p-8 text-center">Chưa có thiết bị</div>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Serial</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Model</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Trạng thái</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Ngày tạo</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {devices.map((d: Record<string, unknown>, idx: number) => (
                        <tr
                          key={String(d.id ?? idx)}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm">{idx + 1}</td>
                          <td className="px-4 py-3 font-mono">{String(d.serialNumber ?? '-')}</td>
                          <td className="px-4 py-3">
                            {String(
                              (d.deviceModel as Record<string, unknown>)?.name ?? d.model ?? '-'
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {String(d.status ?? ((d.isActive as boolean) ? 'ACTIVE' : 'SUSPENDED'))}
                          </td>
                          <td className="px-4 py-3">
                            {d.createdAt
                              ? new Date(String(d.createdAt)).toLocaleString('vi-VN')
                              : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/system/devices/${String(d.id ?? '')}`}
                              className="text-sm text-blue-600"
                            >
                              Chi tiết
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consumables">
          <Card>
            <CardHeader>
              <CardTitle>Vật tư của khách hàng</CardTitle>
              <CardDescription>Danh sách vật tư thuộc khách hàng này</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingConsumables ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : consumables.length === 0 ? (
                <div className="text-muted-foreground p-8 text-center">Chưa có vật tư</div>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Part</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Tên</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          Dòng tương thích
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Dung lượng</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Đã sử dụng</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {consumables.map((c: Record<string, unknown>, idx: number) => (
                        <tr
                          key={String(c.id ?? idx)}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="font-mono text-xs">
                              {String(
                                (c.consumableType as Record<string, unknown>)?.partNumber ?? '-'
                              )}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {String((c.consumableType as Record<string, unknown>)?.name ?? '-')}
                          </td>
                          <td className="text-muted-foreground px-4 py-3 text-sm">
                            {(
                              ((c.consumableType as Record<string, unknown>)
                                ?.compatibleDeviceModels as unknown[] | undefined) || []
                            )
                              .map((dm) => String((dm as Record<string, unknown>).name ?? ''))
                              .filter(Boolean)
                              .join(', ') || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {c.capacity ? `${String(c.capacity)} trang` : '-'}
                          </td>
                          <td className="px-4 py-3">
                            {Number(c.deviceCount ?? 0) > 0 ? (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                Đã sử dụng
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                Chưa sử dụng
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">{String(c.status ?? '-')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle>Hợp đồng của khách hàng</CardTitle>
              <CardDescription>Danh sách hợp đồng thuộc khách hàng này</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingContracts ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
                </div>
              ) : contracts.length === 0 ? (
                <div className="text-muted-foreground p-8 text-center">Chưa có hợp đồng</div>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-sky-50 to-blue-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Mã hợp đồng</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Loại</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Trạng thái</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {contracts.map((c: Contract, idx: number) => (
                        <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-sm">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/system/contracts/${c.id}`}
                              className="text-sky-700 hover:underline"
                            >
                              {c.contractNumber}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm">{c.type}</td>
                          <td className="px-4 py-3 text-sm">{c.status}</td>
                          <td className="px-4 py-3 text-sm">
                            {new Date(c.startDate).toLocaleDateString('vi-VN')} —{' '}
                            {new Date(c.endDate).toLocaleDateString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
