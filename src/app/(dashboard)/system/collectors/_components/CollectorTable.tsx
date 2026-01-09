'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableWrapper } from '@/components/system/TableWrapper'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { ActionGuard } from '@/components/shared/ActionGuard'
import CollectorFormModal from './CollectorFormModal'
import CollectorDetailModal from './CollectorDetailModal'
import { useCollectorsQuery } from '@/lib/hooks/queries/useCollectorsQuery'
import { useCollectorListSocket, CollectorBuildStatusEvent } from '@/lib/hooks/useCollectorSocket'
import { collectorsClientService } from '@/lib/api/services/collectors-client.service'
import type { Collector, CollectorBuildStatus } from '@/types/models/collector'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import Cookies from 'js-cookie'
import {
  Download,
  Eye,
  Loader2,
  Trash2,
  Plus,
  Building2,
  Network,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  XCircle,
  Hammer,
  Wifi,
  WifiOff,
} from 'lucide-react'

// Helper to get customerId from session cookie or localStorage
function getCustomerId(): string | null {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mps_customer_id')
      if (stored) return stored
    }
    const sessionCookie = Cookies.get('mps_session')
    if (sessionCookie) {
      const parts = sessionCookie.split('.')
      if (parts[1]) {
        const payload = JSON.parse(atob(parts[1]))
        return payload.customerId || null
      }
    }
  } catch {
    // ignore errors
  }
  return null
}

interface CollectorTableProps {
  page: number
  pageSize: number
  search: string
  buildStatus?: CollectorBuildStatus
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  renderColumnVisibilityMenu: (menu: ReactNode | null) => void
}

export function CollectorTable({
  page,
  pageSize,
  search,
  buildStatus,
  onPageChange,
  onPageSizeChange,
  renderColumnVisibilityMenu,
}: CollectorTableProps) {
  const queryClient = useQueryClient()
  const { t } = useLocale()
  const [sorting, setSorting] = useState<{ sortBy?: string; sortOrder?: 'asc' | 'desc' }>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [sortVersion, setSortVersion] = useState(0)
  const [collectors, setCollectors] = useState<Collector[]>([])
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [viewingCollector, setViewingCollector] = useState<Collector | null>(null)

  // WebSocket for real-time build status updates
  const handleBuildStatusUpdate = useCallback(
    (data: CollectorBuildStatusEvent) => {
      // Update local collectors state with new status
      setCollectors((cur) =>
        cur.map((c) =>
          c.id === data.collectorId
            ? {
                ...c,
                buildStatus: data.buildStatus,
                buildLog: data.buildLog ?? c.buildLog,
                fileKey: data.fileKey ?? c.fileKey,
                fileSize: data.fileSize ?? c.fileSize,
              }
            : c
        )
      )

      // Show toast notification for status changes
      if (data.buildStatus === 'SUCCESS') {
        toast.success(t('collectors.build_success'), {
          description: data.message,
        })
      } else if (data.buildStatus === 'FAILED') {
        toast.error(t('collectors.build_failed'), {
          description: data.message,
        })
      } else if (data.buildStatus === 'BUILDING') {
        toast.info(t('collectors.build_in_progress'), {
          description: data.message,
        })
      }
    },
    [t]
  )

  // Use customerId-based subscription for real-time updates
  const { isConnected: socketConnected } = useCollectorListSocket({
    customerId: getCustomerId(),
    enabled: true,
    onBuildStatusUpdate: handleBuildStatusUpdate,
  })

  const queryParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      search: search || undefined,
      buildStatus,
      sortBy: sorting.sortBy,
      sortOrder: sorting.sortOrder,
    }),
    [page, pageSize, search, buildStatus, sorting]
  )

  const { data } = useCollectorsQuery(queryParams, { version: sortVersion })

  const queryCollectors = useMemo(() => data?.data ?? [], [data?.data])
  const totalCount = useMemo(
    () => data?.pagination?.total ?? queryCollectors.length,
    [data?.pagination?.total, queryCollectors.length]
  )

  useEffect(() => {
    if (queryCollectors.length > 0) {
      setCollectors(queryCollectors)
    }
  }, [queryCollectors])

  const handleSaved = useCallback(
    (created?: Collector | null) => {
      if (!created) return
      setCollectors((cur) => {
        const exists = cur.some((c) => c.id === created.id)
        if (exists) {
          return cur.map((c) => (c.id === created.id ? created : c))
        }
        return [created, ...cur]
      })
      // No need to join individual collector room - customerId subscription handles all collectors
      void queryClient.invalidateQueries({ queryKey: ['collectors'] })
    },
    [queryClient]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await collectorsClientService.delete(id)
        toast.success(t('collectors.delete_success'))
        if (collectors.length === 1 && page > 1) {
          onPageChange(page - 1)
        } else {
          void queryClient.invalidateQueries({ queryKey: ['collectors'] })
        }
      } catch (error) {
        console.error('Error deleting collector:', error)
        toast.error((error as Error).message || t('collectors.delete_error'))
      }
    },
    [collectors.length, page, onPageChange, queryClient, t]
  )

  const handleDownload = useCallback(
    async (collector: Collector) => {
      if (collector.buildStatus !== 'SUCCESS') {
        toast.error(t('collectors.download_not_available'))
        return
      }
      setDownloadingId(collector.id)
      try {
        const result = await collectorsClientService.getDownloadUrl(collector.id)
        if (result?.downloadUrl) {
          window.open(result.downloadUrl, '_blank')
          toast.success(t('collectors.download_started'))
        } else {
          toast.error(t('collectors.download_error'))
        }
      } catch (error) {
        console.error('Error downloading collector:', error)
        toast.error((error as Error).message || t('collectors.download_error'))
      } finally {
        setDownloadingId(null)
      }
    },
    [t]
  )

  const getBuildStatusBadge = useCallback(
    (status: CollectorBuildStatus) => {
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
    },
    [t]
  )

  const columns = useMemo<ColumnDef<Collector>[]>(
    () => [
      {
        id: 'index',
        header: t('table.index'),
        cell: ({ row, table }) => {
          const index = table.getSortedRowModel().rows.findIndex((r) => r.id === row.id)
          return (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-gradient-to-r from-gray-100 to-gray-50 text-sm font-medium text-gray-700">
              {(page - 1) * pageSize + index + 1}
            </span>
          )
        },
        enableSorting: false,
      },
      {
        accessorKey: 'customerName',
        header: () => (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-600" />
            {t('collectors.customer_name')}
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.customerName}</span>
            {row.original.customer?.code && (
              <span className="text-muted-foreground text-xs">{row.original.customer.code}</span>
            )}
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'address',
        header: () => (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-600" />
            {t('collectors.address')}
          </div>
        ),
        cell: ({ row }) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="line-clamp-2 max-w-[200px] cursor-help text-sm">
                {row.original.address}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{row.original.address}</p>
            </TooltipContent>
          </Tooltip>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'subnets',
        header: () => (
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-gray-600" />
            {t('collectors.subnets')}
          </div>
        ),
        cell: ({ row }) => {
          const subnets = row.original.subnets.split(',')
          return (
            <div className="flex flex-wrap gap-1">
              {subnets.slice(0, 2).map((subnet, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {subnet.trim()}
                </Badge>
              ))}
              {subnets.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{subnets.length - 2}
                </Badge>
              )}
            </div>
          )
        },
        enableSorting: false,
      },
      {
        accessorKey: 'version',
        header: t('collectors.version'),
        cell: ({ row }) => <Badge variant="outline">{row.original.version || 'N/A'}</Badge>,
        enableSorting: true,
      },
      {
        accessorKey: 'buildStatus',
        header: t('collectors.status'),
        cell: ({ row }) => getBuildStatusBadge(row.original.buildStatus),
        enableSorting: true,
      },
      {
        accessorKey: 'fileSize',
        header: t('collectors.file_size'),
        cell: ({ row }) => {
          const size = row.original.fileSize
          if (!size) return <span className="text-muted-foreground">-</span>
          const mb = (size / (1024 * 1024)).toFixed(2)
          return <span>{mb} MB</span>
        },
        enableSorting: true,
      },
      {
        accessorKey: 'createdAt',
        header: () => (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            {t('collectors.created_at')}
          </div>
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {new Date(row.original.createdAt).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'createdBy',
        header: () => (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-600" />
            {t('collectors.created_by')}
          </div>
        ),
        cell: ({ row }) => <span className="text-sm">{row.original.createdBy?.email || '-'}</span>,
        enableSorting: false,
      },
      {
        id: 'actions',
        header: t('table.actions'),
        cell: ({ row }) => {
          const collector = row.original
          return (
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewingCollector(collector)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('collectors.view_detail')}</TooltipContent>
              </Tooltip>

              <ActionGuard pageId="collectors" actionId="download" fallback={null}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={
                        collector.buildStatus !== 'SUCCESS' || downloadingId === collector.id
                      }
                      onClick={() => handleDownload(collector)}
                    >
                      {downloadingId === collector.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {collector.buildStatus === 'SUCCESS'
                      ? t('collectors.download')
                      : t('collectors.download_not_available')}
                  </TooltipContent>
                </Tooltip>
              </ActionGuard>

              <ActionGuard pageId="collectors" actionId="delete" fallback={null}>
                <DeleteDialog
                  title={t('collectors.delete_title')}
                  description={t('collectors.delete_description')}
                  onConfirm={() => handleDelete(collector.id)}
                  trigger={
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('collectors.delete')}</TooltipContent>
                    </Tooltip>
                  }
                />
              </ActionGuard>
            </div>
          )
        },
        enableSorting: false,
      },
    ],
    [t, page, pageSize, getBuildStatusBadge, downloadingId, handleDownload, handleDelete]
  )

  return (
    <>
      <TableWrapper<Collector>
        tableId="collectors"
        columns={columns}
        data={collectors}
        totalCount={totalCount}
        pageIndex={page - 1}
        pageSize={pageSize}
        onPaginationChange={(pagination) => {
          if (pagination.pageSize !== pageSize) {
            onPageSizeChange(pagination.pageSize)
          }
          onPageChange(pagination.pageIndex + 1)
        }}
        onSortingChange={(nextSorting) => {
          setSorting(nextSorting)
          setSortVersion((v) => v + 1)
        }}
        sorting={sorting}
        defaultSorting={{ sortBy: 'createdAt', sortOrder: 'desc' }}
        enableColumnVisibility
        renderColumnVisibilityMenu={renderColumnVisibilityMenu}
        actions={
          <div className="flex items-center gap-2">
            {/* WebSocket connection status indicator */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs ${
                    socketConnected
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {socketConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  <span className="hidden sm:inline">
                    {socketConnected
                      ? t('collectors.realtime_connected')
                      : t('collectors.realtime_disconnected')}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {socketConnected
                  ? t('collectors.realtime_connected_tooltip')
                  : t('collectors.realtime_disconnected_tooltip')}
              </TooltipContent>
            </Tooltip>

            <ActionGuard pageId="collectors" actionId="create" fallback={null}>
              <CollectorFormModal
                onSaved={handleSaved}
                trigger={
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('collectors.create')}
                  </Button>
                }
              />
            </ActionGuard>
          </div>
        }
        emptyState={
          collectors.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
                <Building2 className="h-12 w-12 opacity-20" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-700">{t('collectors.empty')}</h3>
              <p className="mb-6 text-gray-500">{t('collectors.page_subtitle')}</p>
              <ActionGuard pageId="collectors" actionId="create" fallback={null}>
                <CollectorFormModal
                  onSaved={handleSaved}
                  trigger={
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      {t('collectors.create')}
                    </Button>
                  }
                />
              </ActionGuard>
            </div>
          ) : undefined
        }
      />

      {viewingCollector && (
        <CollectorDetailModal
          collector={viewingCollector}
          open={!!viewingCollector}
          onClose={() => setViewingCollector(null)}
          onDownload={handleDownload}
        />
      )}
    </>
  )
}
