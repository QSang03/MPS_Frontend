'use client'

import { useEffect, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Package,
  Plus,
  Sparkles,
  CheckCircle,
  XCircle,
  Box,
  AlertCircle,
} from 'lucide-react'
import { consumablesClientService } from '@/lib/api/services/consumables-client.service'
import { ActionGuard } from '@/components/shared/ActionGuard'
import BulkAssignModal from '@/app/(dashboard)/system/consumables/_components/BulkAssignModal'

export default function ConsumablesPageClient() {
  const [consumables, setConsumables] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const loadConsumables = useCallback(
    async (p = 1) => {
      try {
        setLoading(true)
        const params: Record<string, unknown> = { page: p, limit }
        if (debouncedSearch) params.search = debouncedSearch
        const resRaw = await consumablesClientService.list(params)
        const res = resRaw as Record<string, unknown>
        const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : []
        setConsumables(items as Record<string, unknown>[])
        setTotal(typeof res?.total === 'number' ? res.total : items.length)
        setTotalPages(
          typeof res?.totalPages === 'number'
            ? res.totalPages
            : Math.ceil((typeof res?.total === 'number' ? res.total : items.length) / limit)
        )
      } catch (err) {
        console.error('Load consumables failed', err)
        setConsumables([])
      } finally {
        setLoading(false)
      }
    },
    [limit, debouncedSearch]
  )

  useEffect(() => {
    void loadConsumables(page)
  }, [page, loadConsumables])

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
      setPage(1)
    }, 700)
    return () => clearTimeout(t)
  }, [searchTerm])

  const filteredConsumables = consumables

  return (
    <div className="relative min-h-screen overflow-hidden from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950">
      {/* Animated Background Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-96 w-96 animate-pulse rounded-full bg-gradient-to-r from-emerald-400/20 to-teal-400/20 blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-96 w-96 animate-pulse rounded-full bg-gradient-to-r from-purple-400/20 to-pink-400/20 blur-3xl delay-1000" />
        <div className="absolute top-1/2 left-1/2 h-96 w-96 animate-pulse rounded-full bg-gradient-to-r from-blue-400/20 to-cyan-400/20 blur-3xl delay-500" />
      </div>

      <div className="relative z-10 mx-auto max-w-full space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Card */}
        <div className="rounded-3xl border border-white/30 bg-gradient-to-r from-white/70 via-white/60 to-white/70 p-6 shadow-2xl backdrop-blur-2xl sm:p-8 dark:border-slate-700/50 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 p-3 shadow-lg shadow-emerald-500/30">
                <Package className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="mb-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400">
                  Vật Tư Tiêu Hao
                </h1>
                <p className="font-medium text-slate-600 dark:text-slate-400">
                  Quản lý vật tư liên quan đến thiết bị
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="group relative w-full lg:w-96">
              <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors duration-300 group-focus-within:text-emerald-500 dark:text-slate-500" />
              <Input
                placeholder="Tìm kiếm vật tư..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setDebouncedSearch(searchTerm.trim())
                    setPage(1)
                  }
                }}
                className="rounded-xl border-slate-300/50 bg-white/60 py-3 pl-12 backdrop-blur-xl transition-all duration-300 focus:border-emerald-500 focus:shadow-lg focus:shadow-emerald-500/10 dark:border-slate-600/50 dark:bg-slate-700/60 dark:focus:border-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="overflow-hidden rounded-3xl border border-white/30 bg-gradient-to-br from-white/70 via-white/60 to-white/70 shadow-2xl backdrop-blur-2xl dark:border-slate-700/50 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-emerald-500 to-teal-500 opacity-20 blur-3xl" />
                <Loader2 className="relative h-12 w-12 animate-spin text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="mt-4 text-lg font-medium text-slate-600 dark:text-slate-400">
                Đang tải vật tư...
              </p>
            </div>
          ) : filteredConsumables.length === 0 ? (
            <div className="p-16 text-center">
              <div className="relative mb-6 inline-block">
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-emerald-500 to-teal-500 opacity-20 blur-3xl" />
                <Box className="relative mx-auto h-20 w-20 text-slate-400 dark:text-slate-600" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">
                {searchTerm ? 'Không tìm thấy vật tư' : 'Chưa có vật tư nào'}
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                {searchTerm
                  ? 'Thử thay đổi từ khóa tìm kiếm'
                  : 'Thêm vật tư mới để bắt đầu quản lý'}
              </p>
            </div>
          ) : (
            <>
              {/* Results Summary */}
              <div className="border-b border-slate-200/50 px-8 py-4 dark:border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Hiển thị{' '}
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {filteredConsumables.length}
                    </span>{' '}
                    vật tư
                    <span className="ml-2 text-slate-500 dark:text-slate-500">/ Tổng: {total}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-100 px-3 py-1.5 dark:border-emerald-700 dark:bg-emerald-900/30">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        Trang {page}/{totalPages}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-emerald-200/50 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 dark:border-emerald-700/50 dark:from-emerald-400/20 dark:via-teal-400/20 dark:to-cyan-400/20">
                      <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                        #
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                        Part Number
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                        Serial
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                        Tên vật tư
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                        Dòng tương thích
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                        Dung lượng
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                        Trạng thái lắp đặt
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                    {filteredConsumables.map((c: Record<string, unknown>, idx: number) => (
                      <tr
                        key={(c.id as string) ?? idx}
                        className="group transition-all duration-300 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 dark:hover:from-emerald-900/10 dark:hover:to-teal-900/10"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                          {(page - 1) * limit + idx + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-blue-100 p-1.5 dark:bg-blue-900/30">
                              <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              {String(
                                (c.consumableType as Record<string, unknown>)?.partNumber ?? '-'
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <code className="rounded border border-slate-200 bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
                            {String(c.serialNumber ?? '-')}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {String((c.consumableType as Record<string, unknown>)?.name ?? '-')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(
                              ((c.consumableType as Record<string, unknown>)
                                ?.compatibleDeviceModels as unknown[]) || []
                            )
                              .map((dm) => String((dm as Record<string, unknown>).name ?? ''))
                              .filter(Boolean)
                              .map((name, i) => (
                                <span
                                  key={i}
                                  className="rounded-md border border-violet-200 bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                                >
                                  {name}
                                </span>
                              ))}
                            {(
                              ((c.consumableType as Record<string, unknown>)
                                ?.compatibleDeviceModels as unknown[]) || []
                            ).length === 0 && (
                              <span className="text-sm text-slate-400 dark:text-slate-600">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {c.capacity ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-100 px-2.5 py-1 text-sm font-semibold text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                              <Box className="h-3.5 w-3.5" />
                              {String(c.capacity)} trang
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400 dark:text-slate-600">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {Number(c.deviceCount as unknown as number) > 0 ? (
                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/50 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-3 py-1.5 dark:border-emerald-500/50 dark:from-emerald-400/20 dark:to-teal-400/20">
                              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                Đã lắp
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 dark:border-slate-600 dark:bg-slate-700/50">
                              <AlertCircle className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Chưa lắp
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {String(c.status) === 'ACTIVE' ? (
                            <Badge className="border-0 bg-gradient-to-r from-green-500 to-emerald-500 font-bold text-white shadow-lg shadow-green-500/30 hover:from-green-600 hover:to-emerald-600">
                              <CheckCircle className="mr-1 h-3.5 w-3.5" />
                              ACTIVE
                            </Badge>
                          ) : (
                            <Badge className="border-0 bg-gradient-to-r from-slate-400 to-gray-400 font-bold text-white shadow-lg shadow-slate-400/30 hover:from-slate-500 hover:to-gray-500">
                              <XCircle className="mr-1 h-3.5 w-3.5" />
                              {String(c.status ?? 'INACTIVE')}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="border-t border-slate-200/50 px-8 py-6 dark:border-slate-700/50">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Trang{' '}
                    <span className="text-lg text-emerald-600 dark:text-emerald-400">{page}</span>
                    {' / '}
                    <span className="text-lg text-slate-900 dark:text-white">{totalPages}</span>
                    <span className="ml-2 text-slate-500 dark:text-slate-500">
                      — Hiển thị {filteredConsumables.length} / {total}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1 || loading}
                      className="gap-1 border-slate-300/50 bg-white/60 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-white/80 disabled:opacity-50 disabled:hover:scale-100 dark:border-slate-600/50 dark:bg-slate-700/60 dark:hover:bg-slate-700/80"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages || loading}
                      className="gap-1 border-slate-300/50 bg-white/60 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-white/80 disabled:opacity-50 disabled:hover:scale-100 dark:border-slate-600/50 dark:bg-slate-700/60 dark:hover:bg-slate-700/80"
                    >
                      Sau
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Create Button */}
        <ActionGuard pageId="consumables" actionId="create">
          <div className="rounded-2xl border border-white/30 bg-gradient-to-r from-white/70 via-white/60 to-white/70 p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700/50 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70">
            <BulkAssignModal
              trigger={
                <Button className="group bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-105 hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl hover:shadow-emerald-500/40">
                  <Plus className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
                  Tạo Vật Tư Mới
                </Button>
              }
            />
          </div>
        </ActionGuard>
      </div>
    </div>
  )
}
