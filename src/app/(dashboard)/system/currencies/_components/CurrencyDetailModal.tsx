'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { CurrencyDataDto } from '@/types/models/currency'
import { CheckCircle2, XCircle, Coins, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface CurrencyDetailModalProps {
  currency: CurrencyDataDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CurrencyDetailModal({ currency, open, onOpenChange }: CurrencyDetailModalProps) {
  if (!currency) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Chi tiết tiền tệ
          </DialogTitle>
          <DialogDescription>Thông tin chi tiết về loại tiền tệ</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Mã tiền tệ</p>
                <p className="font-mono text-2xl font-bold text-blue-600">{currency.code}</p>
              </div>
              <div className="text-4xl font-semibold text-gray-700">{currency.symbol}</div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Tên đầy đủ</p>
                <p className="font-medium">{currency.name}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Trạng thái</p>
                <Badge
                  className={
                    currency.isActive
                      ? 'border-green-200 bg-green-500/10 text-green-700'
                      : 'border-gray-200 bg-gray-500/10 text-gray-700'
                  }
                >
                  {currency.isActive ? (
                    <>
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Đang hoạt động
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-1 h-3 w-3" />
                      Không hoạt động
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="flex items-center gap-2 font-semibold">
              <Calendar className="h-4 w-4" />
              Thông tin thời gian
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Ngày tạo</p>
                <p className="font-medium">
                  {currency.createdAt
                    ? format(new Date(currency.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })
                    : 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Ngày cập nhật</p>
                <p className="font-medium">
                  {currency.updatedAt
                    ? format(new Date(currency.updatedAt), 'dd/MM/yyyy HH:mm', { locale: vi })
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
