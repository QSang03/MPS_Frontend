'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { leadsClientService, type Lead } from '@/lib/api/services/leads-client.service'
import { TableSkeleton } from '@/components/system/TableSkeleton'
import { useLocale } from '@/components/providers/LocaleProvider'
import { toast } from 'sonner'

export default function LeadList() {
  const { t } = useLocale()
  const [leads, setLeads] = useState<Lead[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await leadsClientService.list({ page, limit })
      setLeads(res.data)
      setTotal(res.pagination?.total ?? null)
    } catch (error) {
      console.error('Load leads failed', error)
      toast.error(t('error.cannot_load_customer') || 'Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [page, limit, t])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) return <TableSkeleton rows={8} columns={6} />

  return (
    <div className="overflow-x-auto rounded-lg bg-white p-4 shadow-sm">
      <table className="w-full table-fixed text-sm">
        <thead>
          <tr className="text-left text-xs font-medium text-gray-500">
            <th className="w-8">#</th>
            <th>Họ tên</th>
            <th>Email</th>
            <th>Số điện thoại</th>
            <th>Công ty</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-8 text-center text-sm text-gray-500">
                {t('empty.no_data.title') || 'No leads found'}
              </td>
            </tr>
          ) : (
            leads.map((l, idx) => (
              <tr key={l.id} className="border-t">
                <td className="py-3">{(page - 1) * limit + idx + 1}</td>
                <td className="py-3">{l.fullName}</td>
                <td className="py-3">{l.email}</td>
                <td className="py-3">{l.phone || '—'}</td>
                <td className="py-3">{l.company || '—'}</td>
                <td className="py-3">{l.status || 'PENDING'}</td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <button
                      className="rounded border px-2 py-1 text-xs"
                      onClick={async () => {
                        try {
                          const updated = await leadsClientService.update(l.id, {
                            status: 'CONTACTED',
                          })
                          if (updated) {
                            setLeads((cur) => cur.map((x) => (x.id === updated.id ? updated : x)))
                            toast.success(t('toast.refreshed') || 'Updated')
                          }
                        } catch (err) {
                          console.error('Update lead failed', err)
                          toast.error((err as Error).message || 'Failed to update')
                        }
                      }}
                    >
                      {t('button.save') || 'Mark Contacted'}
                    </button>
                    <button
                      className="rounded border px-2 py-1 text-xs"
                      onClick={async () => {
                        if (!confirm('Delete this lead?')) return
                        try {
                          const ok = await leadsClientService.delete(l.id)
                          if (ok) {
                            setLeads((cur) => cur.filter((x) => x.id !== l.id))
                            toast.success(t('customer.delete_success') || 'Deleted')
                          }
                        } catch (err) {
                          console.error('Delete lead failed', err)
                          toast.error((err as Error).message || 'Failed to delete')
                        }
                      }}
                    >
                      {t('button.delete') || 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* pagination simple */}
      <div className="mt-4 flex items-center justify-between">
        <div>
          <label className="text-muted-foreground text-sm">Rows per page:</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="ml-2 rounded border px-2 py-1 text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded border px-3 py-1 text-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </button>
          <div className="text-sm">
            Page {page}
            {total ? ` of ${Math.ceil(total / limit)}` : ''}
          </div>
          <button
            className="rounded border px-3 py-1 text-sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={total !== null && page >= Math.ceil(total / limit)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
