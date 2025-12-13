'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Wrench,
  AlertCircle,
  Eye,
  Search,
  RefreshCw,
  Trash2,
  Star,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import { maintenanceHistoriesClientService } from '@/lib/api/services/maintenance-histories-client.service'
import { MaintenanceHistoryFormModal } from './MaintenanceHistoryFormModal'
import type { MaintenanceHistory } from '@/types/models'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

interface MaintenanceHistoryTabProps {
  deviceId: string
}

export function MaintenanceHistoryTab({ deviceId }: MaintenanceHistoryTabProps) {
  const { t } = useLocale()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [minSatisfaction, setMinSatisfaction] = useState<number | 'ALL'>('ALL')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    item: MaintenanceHistory | null
  }>({
    open: false,
    item: null,
  })

  const {
    data: maintenanceData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['maintenance-histories', deviceId, page, limit, search, minSatisfaction, sortOrder],
    queryFn: async () => {
      const params: Parameters<typeof maintenanceHistoriesClientService.getByDeviceId>[1] = {
        page,
        limit,
        sortBy: 'maintenanceDate',
        sortOrder,
      }
      if (search) params.search = search
      if (minSatisfaction !== 'ALL') params.minSatisfaction = minSatisfaction

      return maintenanceHistoriesClientService.getByDeviceId(deviceId, params)
    },
    staleTime: 30000,
    enabled: Boolean(deviceId),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => maintenanceHistoriesClientService.delete(id),
    onSuccess: () => {
      toast.success(t('maintenance_history.delete_success'))
      queryClient.invalidateQueries({ queryKey: ['maintenance-histories', deviceId] })
      setDeleteDialog({ open: false, item: null })
    },
    onError: () => {
      toast.error(t('maintenance_history.delete_error'))
    },
  })

  const { data: maintenanceHistories, pagination } = maintenanceData || {
    data: [],
    pagination: undefined,
  }
  const totalPages = pagination?.totalPages ?? 1
  const total = pagination?.total ?? 0

  const handleSearch = () => {
    setSearch(searchInput.trim())
    setPage(1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const formatDate = (date?: string | null) => {
    if (!date) return t('common.unknown')
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatRelativeTime = (date: string) => {
    const now = new Date()
    const d = new Date(date)
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return t('relative.minutes_ago', { count: diffMins })
    if (diffHours < 24) return t('relative.hours_ago', { count: diffHours })
    if (diffDays < 30) return t('relative.days_ago', { count: diffDays })
    return formatDate(date)
  }

  const renderStars = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < score ? 'fill-current text-yellow-400' : 'text-gray-300'}`}
      />
    ))
  }

  const handleDelete = (item: MaintenanceHistory) => {
    setDeleteDialog({ open: true, item })
  }

  const confirmDelete = () => {
    if (deleteDialog.item) {
      deleteMutation.mutate(deleteDialog.item.id)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-[var(--warning-500)]" />
                {t('device_maintenance.history_title')}
              </CardTitle>
              <CardDescription className="mt-1">
                {t('device_maintenance.history_subtitle')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="gap-2"
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                {t('button.refresh')}
              </Button>
              <MaintenanceHistoryFormModal
                mode="create"
                deviceId={deviceId}
                onSaved={() => refetch()}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder={t('maintenance_history.search_placeholder')}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleSearch}>
                {t('button.search')}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={String(minSatisfaction)}
                onValueChange={(v) => {
                  setMinSatisfaction(v === 'ALL' ? 'ALL' : Number(v))
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t('maintenance_history.filter_by_satisfaction')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('placeholder.all')}</SelectItem>
                  {[1, 2, 3, 4, 5].map((score) => (
                    <SelectItem key={score} value={String(score)}>
                      {t(`maintenance_history.satisfaction_score_${score}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={sortOrder}
                onValueChange={(v) => {
                  setSortOrder(v as 'asc' | 'desc')
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t('filters.sort_label')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">{t('sort.newest')}</SelectItem>
                  <SelectItem value="asc">{t('sort.oldest')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Maintenance History Table */}
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-600)]" />
            </div>
          ) : isError ? (
            <div className="text-muted-foreground p-8 text-center">
              <AlertCircle className="mx-auto mb-3 h-12 w-12 text-[var(--color-error-500)] opacity-20" />
              <p className="text-[var(--color-error-500)]">{t('maintenance_history.load_error')}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
                {t('button.retry')}
              </Button>
            </div>
          ) : maintenanceHistories.length === 0 ? (
            <div className="text-muted-foreground p-8 text-center">
              <Wrench className="mx-auto mb-3 h-12 w-12 opacity-20" />
              <p>{t('maintenance_history.empty')}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        {t('maintenance_history.date')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        {t('maintenance_history.description')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        {t('maintenance_history.staff_name')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        {t('maintenance_history.satisfaction_score')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        {t('maintenance_history.created_at')}
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold">
                        {t('table.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {maintenanceHistories.map((item: MaintenanceHistory) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm">
                                {formatRelativeTime(item.maintenanceDate)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{formatDate(item.maintenanceDate)}</TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="max-w-[200px] px-4 py-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="truncate font-medium">{item.description}</div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                              <p className="font-medium">{item.description}</p>
                              {item.customerFeedback && (
                                <p className="text-muted-foreground mt-1 text-xs">
                                  {t('maintenance_history.customer_feedback')}:{' '}
                                  {item.customerFeedback}
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="px-4 py-3 text-sm">{item.staffName}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {renderStars(item.satisfactionScore)}
                            <span className="ml-1 text-xs">{item.satisfactionScore}/5</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-muted-foreground text-sm">
                                {formatRelativeTime(item.createdAt)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{formatDate(item.createdAt)}</TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {item.attachmentUrls.length > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="icon" className="h-8 w-8">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {t('maintenance_history.view_attachments')}
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <MaintenanceHistoryFormModal
                              mode="edit"
                              maintenanceHistory={item}
                              deviceId={deviceId}
                              onSaved={() => refetch()}
                              compact
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                              onClick={() => handleDelete(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {maintenanceHistories.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <span>
                  {t('pagination.showing_range_results', {
                    from: String((page - 1) * limit + 1),
                    to: String(Math.min(page * limit, total)),
                    total: String(total),
                  })}
                </span>
                <Select
                  value={String(limit)}
                  onValueChange={(v) => {
                    setLimit(Number(v))
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-muted-foreground text-sm">
                  {t('pagination.page_of', { page: String(page), totalPages: String(totalPages) })}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, item: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('maintenance_history.delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('maintenance_history.delete_confirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('button.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('button.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
