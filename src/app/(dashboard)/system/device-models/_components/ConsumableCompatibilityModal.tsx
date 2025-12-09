'use client'

import { useEffect, useState, useCallback } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { deviceModelsClientService } from '@/lib/api/services/device-models-client.service'
import type { ConsumableType } from '@/types/models/consumable-type'
import {
  Trash2,
  Plus,
  Loader2,
  Package,
  Search,
  CheckCircle2,
  AlertCircle,
  Zap,
  BarChart3,
} from 'lucide-react'
import { AddConsumableModal } from './AddConsumableModal'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { cn } from '@/lib/utils'
import { useLocale } from '@/components/providers/LocaleProvider'

interface ConsumableCompatibilityModalProps {
  deviceModelId: string
  deviceModelName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConsumableCompatibilityModal({
  deviceModelId,
  deviceModelName,
  open,
  onOpenChange,
}: ConsumableCompatibilityModalProps) {
  const [compatibleConsumables, setCompatibleConsumables] = useState<ConsumableType[]>([])
  const [filteredConsumables, setFilteredConsumables] = useState<ConsumableType[]>([])
  const [loading, setLoading] = useState(true)
  // removingId no longer needed because DeleteDialog shows its own progress
  // const [removingId, setRemovingId] = useState<string | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [hideOuter, setHideOuter] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { t } = useLocale()

  const loadCompatibleConsumables = useCallback(async () => {
    try {
      setLoading(true)
      const compatible = await deviceModelsClientService.getCompatibleConsumables(deviceModelId)
      setCompatibleConsumables(compatible)
      setFilteredConsumables(compatible)
    } catch (error: unknown) {
      console.error('Error loading compatible consumables:', error)
      toast.error(String(error) || t('device_model.compatibility.load_error'))
    } finally {
      setLoading(false)
    }
  }, [deviceModelId, t])

  useEffect(() => {
    if (open) {
      void loadCompatibleConsumables()
    }
  }, [open, loadCompatibleConsumables])

  // Filter consumables based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredConsumables(compatibleConsumables)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = compatibleConsumables.filter((c) => {
      return (
        c.name?.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term) ||
        c.unit?.toLowerCase().includes(term)
      )
    })
    setFilteredConsumables(filtered)
  }, [searchTerm, compatibleConsumables])

  const removeCompatibility = async (consumableTypeId: string) => {
    try {
      const res: unknown = await deviceModelsClientService.removeCompatibleConsumable(
        deviceModelId,
        consumableTypeId
      )

      // The API route may return a business-error payload with 200 status (e.g. { error: 'COMPATIBILITY_IN_USE', message: 'Cannot remove...'}).
      // If payload contains an error/message, surface it to the user. Otherwise treat as success.
      const payload = (res ?? {}) as { error?: string; message?: string } | undefined
      if (payload && (payload.error || payload.message)) {
        // Prefer Vietnamese user-facing message for known business error
        if (
          payload.error === 'COMPATIBILITY_IN_USE' ||
          /compatibilit/i.test(String(payload.message))
        ) {
          toast.error(t('device_model.compatibility.remove_in_use'))
        } else {
          const msg =
            payload.message || payload.error || t('device_model.compatibility.remove_error')
          toast.error(msg)
        }

        // don't refresh list since removal didn't happen
        return
      }

      toast.success(t('device_model.compatibility.remove_success'))
      await loadCompatibleConsumables()
    } catch (error: unknown) {
      console.error('Error removing compatibility:', error)

      // Backend may return a specific error when the consumable is in use by devices
      // Example payload: { error: 'COMPATIBILITY_IN_USE', message: 'Cannot remove compatibility while devices are using this consumable type' }
      const err = error as { response?: { data?: unknown }; message?: string } | undefined
      const errPayload = (err?.response?.data ?? (err as { message?: string } | undefined)) as
        | { error?: string; code?: string; message?: string }
        | undefined
      const code = errPayload?.error || errPayload?.code
      const msg =
        errPayload?.message || err?.message || t('device_model.compatibility.remove_error')

      if (code === 'COMPATIBILITY_IN_USE' || /compatibilit/i.test(String(msg))) {
        toast.error(t('device_model.compatibility.remove_in_use'))
      } else {
        toast.error(msg)
      }

      // Don't re-throw: we've handled the error and shown a user-friendly toast.
      // This prevents the exception from bubbling up and being logged as an unhandled error
      // in the API-route / DeleteDialog call stack.
      return
    }
  }

  const handleAdded = () => {
    loadCompatibleConsumables()
  }

  const activeCount = compatibleConsumables.filter((c) => c.isActive).length
  const inactiveCount = compatibleConsumables.length - activeCount

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <SystemModalLayout
          title={t('device_model.compatibility.title')}
          description={t('device_model.compatibility.description', { modelName: deviceModelName })}
          icon={Zap}
          variant="view"
          maxWidth={`${hideOuter ? 'hidden' : '!max-w-[75vw]'}`}
        >
          {/* Quick Stats */}
          <div className="mb-4 grid grid-cols-3 gap-3 rounded-lg border border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4">
            <div className="rounded-lg border border-emerald-200 bg-white p-2.5">
              <p className="text-xs text-gray-600">{t('device_model.compatibility.total_label')}</p>
              <p className="mt-1 text-xl font-bold text-emerald-600">
                {compatibleConsumables.length}
              </p>
            </div>
            <div className="rounded-lg border border-green-200 bg-white p-2.5">
              <p className="text-xs text-gray-600">
                {t('device_model.compatibility.active_label')}
              </p>
              <p className="mt-1 text-xl font-bold text-green-600">{activeCount}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-2.5">
              <p className="text-xs text-gray-600">
                {t('device_model.compatibility.inactive_label')}
              </p>
              <p className="mt-1 text-xl font-bold text-gray-600">{inactiveCount}</p>
            </div>
          </div>
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-muted-foreground">{t('common.loading')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-4">
                {compatibleConsumables.length > 0 && (
                  <div className="relative max-w-xs flex-1">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      placeholder={t('device_model.compatibility.search_placeholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                )}

                <Button
                  onClick={() => {
                    // hide outer modal content (keep component mounted) then open add modal
                    setHideOuter(true)
                    setAddModalOpen(true)
                  }}
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  <Plus className="h-4 w-4" />
                  {t('device_model.compatibility.add_button')}
                </Button>
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-emerald-600" />
                          {t('device_model.compatibility.table.name')}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        {t('device_model.compatibility.table.unit')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        {t('device_model.compatibility.table.description')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        {t('device_model.compatibility.table.status')}
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">
                        {t('table.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredConsumables.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center">
                          <div className="text-muted-foreground flex flex-col items-center gap-3">
                            {searchTerm ? (
                              <>
                                <Search className="h-12 w-12 opacity-20" />
                                <p>{t('device_model.compatibility.empty_search')}</p>
                              </>
                            ) : (
                              <>
                                <Package className="h-12 w-12 opacity-20" />
                                <p>{t('device_model.compatibility.empty_none')}</p>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredConsumables.map((c, index) => (
                        <tr
                          key={c.id}
                          className="transition-colors hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50"
                        >
                          <td className="text-muted-foreground px-4 py-3 text-sm">{index + 1}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-emerald-700">{c.name || '—'}</div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant="outline" className="font-mono">
                              {c.unit || '—'}
                            </Badge>
                          </td>
                          <td className="text-muted-foreground px-4 py-3 text-sm">
                            {c.description || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={c.isActive ? 'default' : 'secondary'}
                              className={cn(
                                'flex w-fit items-center gap-1.5',
                                c.isActive
                                  ? 'bg-green-500 hover:bg-green-600'
                                  : 'bg-gray-400 hover:bg-gray-500'
                              )}
                            >
                              {c.isActive ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <AlertCircle className="h-3 w-3" />
                              )}
                              {c.isActive ? t('status.active') : t('status.inactive')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DeleteDialog
                              title={t('common.confirm_delete')}
                              description={t('device_model.compatibility.delete_confirmation')}
                              onConfirm={() => removeCompatibility(c.id)}
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="transition-all hover:bg-red-100 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              }
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer Stats */}
              {filteredConsumables.length > 0 && (
                <div className="text-muted-foreground flex items-center justify-between border-t pt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>
                      {t('device_model.compatibility.footer_showing', {
                        count: String(filteredConsumables.length),
                      })}
                      {searchTerm &&
                        compatibleConsumables.length !== filteredConsumables.length && (
                          <span> / {compatibleConsumables.length}</span>
                        )}
                    </span>
                  </div>

                  {searchTerm && compatibleConsumables.length !== filteredConsumables.length && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchTerm('')}
                      className="h-8"
                    >
                      {t('device_model.compatibility.clear_filter')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </SystemModalLayout>
      </Dialog>

      {/* Add Consumable Modal - rendered outside the outer DialogContent so it stays mounted while outer dialog is closed */}
      <AddConsumableModal
        deviceModelId={deviceModelId}
        deviceModelName={deviceModelName}
        existingConsumableIds={new Set(compatibleConsumables.map((c) => c.id))}
        open={addModalOpen}
        onOpenChange={(v: boolean) => {
          setAddModalOpen(v)
          // when add modal closes, un-hide the outer compatibility modal and refresh list
          if (!v) {
            setHideOuter(false)
            // refresh list in case new item was added
            loadCompatibleConsumables()
          }
        }}
        onAdded={() => {
          handleAdded()
        }}
      />
    </>
  )
}
