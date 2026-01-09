'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useLocale } from '@/components/providers/LocaleProvider'
import type { Collector } from '@/types/models/collector'
import {
  Building2,
  Calendar,
  Download,
  FileText,
  Network,
  User,
  CheckCircle2,
  Clock,
  XCircle,
  Hammer,
  HardDrive,
  Globe,
} from 'lucide-react'

interface CollectorDetailModalProps {
  collector: Collector
  open: boolean
  onClose: () => void
  onDownload?: (collector: Collector) => void
}

export default function CollectorDetailModal({
  collector,
  open,
  onClose,
  onDownload,
}: CollectorDetailModalProps) {
  const { t } = useLocale()

  const getBuildStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            {t('collectors.status_success')}
          </Badge>
        )
      case 'PENDING':
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
          >
            <Clock className="mr-1 h-3 w-3" />
            {t('collectors.status_pending')}
          </Badge>
        )
      case 'BUILDING':
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          >
            <Hammer className="mr-1 h-3 w-3 animate-pulse" />
            {t('collectors.status_building')}
          </Badge>
        )
      case 'FAILED':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            {t('collectors.status_failed')}
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-'
    const mb = (bytes / (1024 * 1024)).toFixed(2)
    return `${mb} MB`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('collectors.detail_title')}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* Status and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">{t('collectors.status')}:</span>
                {getBuildStatusBadge(collector.buildStatus)}
              </div>
              {collector.buildStatus === 'SUCCESS' && onDownload && (
                <Button size="sm" onClick={() => onDownload(collector)}>
                  <Download className="mr-2 h-4 w-4" />
                  {t('collectors.download')}
                </Button>
              )}
            </div>

            <Separator />

            {/* Customer Info */}
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 font-medium">
                <Building2 className="h-4 w-4" />
                {t('collectors.customer_info')}
              </h4>
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <span className="text-muted-foreground text-sm">
                    {t('collectors.customer_name')}
                  </span>
                  <p className="font-medium">{collector.customerName}</p>
                </div>
                {collector.customer?.code && (
                  <div>
                    <span className="text-muted-foreground text-sm">
                      {t('collectors.customer_code')}
                    </span>
                    <p className="font-medium">{collector.customer.code}</p>
                  </div>
                )}
              </div>
              <div className="pl-6">
                <span className="text-muted-foreground text-sm">{t('collectors.address')}</span>
                <p className="font-medium">{collector.address}</p>
              </div>
            </div>

            <Separator />

            {/* Network Config */}
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 font-medium">
                <Network className="h-4 w-4" />
                {t('collectors.network_config')}
              </h4>
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <span className="text-muted-foreground text-sm">{t('collectors.subnets')}</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {collector.subnets.split(',').map((subnet, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {subnet.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">{t('collectors.community')}</span>
                  <p className="font-medium">{collector.community}</p>
                </div>
              </div>
              {collector.processorUrl && (
                <div className="pl-6">
                  <span className="text-muted-foreground text-sm">
                    {t('collectors.processor_url')}
                  </span>
                  <p className="flex items-center gap-1 font-medium">
                    <Globe className="h-3 w-3" />
                    {collector.processorUrl}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Build Info */}
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 font-medium">
                <HardDrive className="h-4 w-4" />
                {t('collectors.build_info')}
              </h4>
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <span className="text-muted-foreground text-sm">{t('collectors.version')}</span>
                  <p className="font-medium">{collector.version || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">{t('collectors.file_size')}</span>
                  <p className="font-medium">{formatFileSize(collector.fileSize)}</p>
                </div>
              </div>
              {collector.buildLog && (
                <div className="pl-6">
                  <span className="text-muted-foreground text-sm">{t('collectors.build_log')}</span>
                  <pre className="bg-muted mt-1 max-h-32 overflow-auto rounded-md p-2 text-xs">
                    {collector.buildLog}
                  </pre>
                </div>
              )}
            </div>

            <Separator />

            {/* Metadata */}
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 font-medium">
                <Calendar className="h-4 w-4" />
                {t('collectors.metadata')}
              </h4>
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <span className="text-muted-foreground text-sm">
                    {t('collectors.created_at')}
                  </span>
                  <p className="font-medium">{formatDate(collector.createdAt)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">
                    {t('collectors.updated_at')}
                  </span>
                  <p className="font-medium">{formatDate(collector.updatedAt)}</p>
                </div>
              </div>
              {collector.createdBy && (
                <div className="pl-6">
                  <span className="text-muted-foreground flex items-center gap-1 text-sm">
                    <User className="h-3 w-3" />
                    {t('collectors.created_by')}
                  </span>
                  <p className="font-medium">{collector.createdBy.email}</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
