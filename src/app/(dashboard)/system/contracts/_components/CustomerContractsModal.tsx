'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, FileText, Calendar, Tag, Building2, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { VN } from '@/constants/vietnamese'

interface Contract {
  id: string
  contractNumber: string
  type: string
  status: string
  startDate: string
  endDate: string
  description?: string
  documentUrl?: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: string
  customerName: string
}

export default function CustomerContractsModal({
  open,
  onOpenChange,
  customerId,
  customerName,
}: Props) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(false)
  const [page] = useState(1)
  const [limit] = useState(20)

  useEffect(() => {
    if (!open || !customerId) return

    const fetchCustomerContracts = async () => {
      setLoading(true)
      try {
        const query = new URLSearchParams()
        query.set('page', String(page))
        query.set('limit', String(limit))

        const url = `/api/customers/${customerId}/contracts?${query.toString()}`
        const res = await fetch(url)

        if (!res.ok) {
          const txt = await res.text().catch(() => '')
          throw new Error(txt || res.statusText)
        }

        const data = await res.json()

        // Handle different response formats
        let list: Contract[] = []
        if (Array.isArray(data)) {
          list = data
        } else if (Array.isArray(data.data)) {
          list = data.data
        } else if (data.success && Array.isArray(data.data)) {
          list = data.data
        }

        setContracts(list)
      } catch (err) {
        console.error('Failed to fetch customer contracts', err)
        toast.error('Không thể tải danh sách hợp đồng của khách hàng')
      } finally {
        setLoading(false)
      }
    }

    fetchCustomerContracts()
  }, [open, customerId, page, limit])

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500 hover:bg-green-600'
      case 'PENDING':
        return 'bg-yellow-500 hover:bg-yellow-600'
      case 'EXPIRED':
        return 'bg-red-500 hover:bg-red-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  const getStatusLabel = (status?: string) => {
    if (!status) return '—'
    switch (status) {
      case 'ACTIVE':
        return VN.status.active
      case 'PENDING':
        return VN.status.pending
      case 'EXPIRED':
        return VN.status.expired
      case 'TERMINATED':
        return VN.status.terminated
      default:
        return status
    }
  }

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'MPS':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'CONSUMABLE_ONLY':
        return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'REPAIR':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl overflow-hidden rounded-3xl border-0 p-0 shadow-2xl">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-sky-600 via-cyan-600 to-blue-600 px-8 py-6">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <DialogHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-white/30 bg-white/20 p-3 backdrop-blur-sm">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-white">
                    Hợp đồng của khách hàng
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-blue-100">
                    <span className="font-semibold text-white">{customerName}</span>
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-4 p-16">
              <Loader2 className="h-12 w-12 animate-spin text-sky-600" />
              <p className="text-sm font-medium text-slate-600">Đang tải danh sách hợp đồng...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-3 p-16">
              <div className="rounded-full bg-slate-100 p-6">
                <FileText className="h-12 w-12 text-slate-400" />
              </div>
              <p className="text-lg font-medium text-slate-600">Chưa có hợp đồng nào</p>
              <p className="text-sm text-slate-500">
                Khách hàng này chưa có hợp đồng nào trong hệ thống
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border-2 border-gray-200 shadow-lg">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-sky-50 to-blue-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-sky-600" />
                        Mã hợp đồng
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-blue-600" />
                        Loại
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        Thời gian
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {contracts.map((c) => (
                    <tr
                      key={c.id}
                      className="transition-all hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50"
                    >
                      <td className="px-4 py-3">
                        <Link href={`/system/contracts/${c.id}`} className="hover:underline">
                          <code className="rounded bg-sky-100 px-2 py-1 text-sm font-semibold text-sky-700">
                            {c.contractNumber}
                          </code>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`border-2 ${getTypeColor(c.type)}`}>{c.type}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn('border-0 text-white', getStatusColor(c.status))}>
                          {getStatusLabel(c.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="text-muted-foreground h-3.5 w-3.5" />
                          <span>
                            {new Date(c.startDate).toLocaleDateString('vi-VN')} —{' '}
                            {new Date(c.endDate).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/system/contracts/${c.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-sky-600 hover:bg-sky-50"
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Xem
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {contracts.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>
                  Tổng cộng:{' '}
                  <span className="font-semibold text-slate-900">{contracts.length}</span> hợp đồng
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
