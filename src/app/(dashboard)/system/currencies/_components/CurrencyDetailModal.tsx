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
import { useLocale } from '@/components/providers/LocaleProvider'

interface CurrencyDetailModalProps {
  currency: CurrencyDataDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CurrencyDetailModal({ currency, open, onOpenChange }: CurrencyDetailModalProps) {
  const { t } = useLocale()

  if (!currency) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            {t('currencies.detail.title')}
          </DialogTitle>
          <DialogDescription>{t('currencies.detail.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">{t('currencies.detail.code_label')}</p>
                <p className="font-mono text-2xl font-bold text-[var(--brand-600)]">
                  {currency.code}
                </p>
              </div>
              <div className="text-4xl font-semibold text-gray-700">{currency.symbol}</div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">{t('currencies.detail.name_label')}</p>
                <p className="font-medium">{currency.name}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">{t('currencies.detail.status_label')}</p>
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
                      {t('status.active')}
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-1 h-3 w-3" />
                      {t('status.inactive')}
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
              {t('currencies.detail.timestamps_title')}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">{t('currencies.detail.created_at')}</p>
                <p className="font-medium">
                  {currency.createdAt
                    ? format(new Date(currency.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })
                    : t('common.not_available')}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">{t('currencies.detail.updated_at')}</p>
                <p className="font-medium">
                  {currency.updatedAt
                    ? format(new Date(currency.updatedAt), 'dd/MM/yyyy HH:mm', { locale: vi })
                    : t('common.not_available')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
