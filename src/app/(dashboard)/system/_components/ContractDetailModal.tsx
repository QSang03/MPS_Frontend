'use client'

import { useQuery } from '@tanstack/react-query'
import internalApiClient from '@/lib/api/internal-client'
import type { Contract } from '@/types/models/contract'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Calendar, Building2, FileText } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractId?: string | null
}

function formatDate(dateString?: string) {
  if (!dateString) return '—'
  try {
    return new Date(dateString).toLocaleDateString('vi-VN')
  } catch {
    return dateString
  }
}

export default function ContractDetailModal({ open, onOpenChange, contractId }: Props) {
  const { data, isLoading } = useQuery<Contract | null>({
    queryKey: ['contract-detail', contractId],
    queryFn: async () => {
      if (!contractId) return null
      const res = await internalApiClient.get(`/api/contracts/${contractId}`)
      const payload = res.data?.data ?? res.data
      return (payload ?? null) as Contract | null
    },
    enabled: open && !!contractId,
    staleTime: 1000 * 60 * 2,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <DialogContent className="max-w-3xl rounded-2xl border-0 p-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/20 p-2">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Chi tiết hợp đồng</DialogTitle>
                <DialogDescription className="text-sm opacity-90">
                  Thông tin chi tiết hợp đồng
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="bg-white p-6">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : !data ? (
              <div>Không tìm thấy hợp đồng</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{data.contractNumber || '—'}</h3>
                    <p className="text-sm text-gray-600">{data.type || '—'}</p>
                  </div>
                  <div className="text-sm text-gray-500">{data.status || '—'}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Khách hàng</div>
                      <div>{data.customer?.name ?? data.customerId ?? '—'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Thời gian</div>
                      <div>
                        {formatDate(data.startDate)} — {formatDate(data.endDate)}
                      </div>
                    </div>
                  </div>
                </div>

                {data.description && (
                  <div>
                    <div className="text-sm font-medium">Mô tả</div>
                    <div className="text-sm text-gray-700">{data.description}</div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Đóng
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}
