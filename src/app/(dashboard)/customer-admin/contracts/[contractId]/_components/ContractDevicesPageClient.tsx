'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Package, Search } from 'lucide-react'
import contractsClientService from '@/lib/api/services/contracts-client.service'
import type { ContractDevice } from '@/types/models/contract-device'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ContractDevicesPageClient({ contractId }: { contractId: string }) {
  const router = useRouter()
  const [devices, setDevices] = useState<ContractDevice[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  const loadDevices = async () => {
    setLoading(true)
    try {
      const res = await contractsClientService.listDevices(contractId, {
        page,
        limit,
        search: debouncedSearch || undefined,
      })
      setDevices(res.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDevices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page, contractId])

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 800) // debounce nhanh hơn, UX tốt hơn
    return () => clearTimeout(t)
  }, [search])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-gradient bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-3xl font-extrabold text-transparent">
          Thiết bị trong hợp đồng
        </h2>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl px-5 py-2 transition hover:bg-sky-100 dark:hover:bg-sky-700"
        >
          Quay lại
        </Button>
      </div>

      <Card className="rounded-2xl border border-slate-200 shadow-xl dark:border-slate-700">
        <CardHeader className="rounded-t-2xl bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
          <CardTitle className="flex items-center gap-3 text-xl font-semibold text-sky-700 dark:text-sky-400">
            <Package className="h-6 w-6" />
            Danh sách thiết bị
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Các thiết bị đang gán với hợp đồng này
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-6 flex items-center justify-between">
            <div className="relative w-96">
              <Search className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm kiếm thiết bị..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setDebouncedSearch(search)
                    setPage(1)
                  }
                }}
                className="rounded-lg border-slate-300 pl-12 dark:border-slate-700"
                autoFocus
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Loader2 className="h-10 w-10 animate-spin text-sky-500" />
              <p className="mt-4 font-medium text-slate-600 dark:text-slate-400">
                Đang tải dữ liệu...
              </p>
            </div>
          ) : devices.length === 0 ? (
            <div className="py-12 text-center font-medium text-slate-500 dark:text-slate-400">
              Không có thiết bị
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-300 shadow-lg dark:border-slate-700">
              <table className="w-full min-w-[750px] table-auto">
                <thead className="bg-gradient-to-r from-sky-100 to-indigo-100 dark:from-slate-700 dark:to-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-sky-700 dark:text-sky-400">
                      Serial
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-sky-700 dark:text-sky-400">
                      Model
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-sky-700 dark:text-sky-400">
                      Vị trí
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-sky-700 dark:text-sky-400">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((d) => (
                    <tr
                      key={d.id}
                      className="transition hover:bg-gradient-to-r hover:from-sky-50 hover:to-indigo-50 dark:hover:from-slate-800 dark:hover:to-slate-900"
                    >
                      <td className="px-6 py-3 font-mono text-sm text-sky-700 dark:text-sky-300">
                        {d.device?.id || d.deviceId ? (
                          <Link
                            href={`/customer-admin/devices/${d.device?.id ?? d.deviceId}`}
                            className="hover:underline"
                          >
                            {d.device?.serialNumber ?? d.deviceId ?? '—'}
                          </Link>
                        ) : (
                          (d.device?.serialNumber ?? '—')
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-400">
                        {d.device?.deviceModel?.name ?? '—'}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-400">
                        {d.device?.location ?? '—'}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                            d.device?.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : d.device?.status === 'Inactive'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                          }`}
                        >
                          {d.device?.status ?? '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
