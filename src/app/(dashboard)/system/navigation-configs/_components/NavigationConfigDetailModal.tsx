'use client'

import React from 'react'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { NavigationConfig } from '@/types/navigation-config'
import { Settings, Calendar, CheckCircle2, XCircle, Package } from 'lucide-react'
import { format } from 'date-fns'
import { vi, enUS } from 'date-fns/locale'
import { useLocale } from '@/components/providers/LocaleProvider'

interface Props {
  config: NavigationConfig | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function NavigationConfigDetailModal({ config, open, onOpenChange }: Props) {
  const { t, locale } = useLocale()

  if (!config) return null

  const itemsCount = config.config?.items?.length || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SystemModalLayout
        title={t('navigation_config.detail_title')}
        description={t('navigation_config.detail_subtitle')}
        icon={Settings}
      >
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                {t('navigation_config.fields.name')}
              </label>
              <p className="mt-1 text-sm text-gray-900">{config.name}</p>
            </div>

            {config.description && (
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t('navigation_config.fields.description')}
                </label>
                <p className="mt-1 text-sm text-gray-900">{config.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t('navigation_config.fields.customer')}
                </label>
                <div className="mt-1 space-y-1">
                  {config.customer ? (
                    <>
                      <Badge variant="outline" className="block w-fit">
                        {config.customer.name || config.customer.code || config.customerId}
                      </Badge>
                      {config.customer.code && (
                        <p className="text-xs text-gray-500">Code: {config.customer.code}</p>
                      )}
                      {config.customer.contactEmail && (
                        <p className="text-xs text-gray-500">{config.customer.contactEmail}</p>
                      )}
                    </>
                  ) : config.customerId ? (
                    <Badge variant="outline">{config.customerId}</Badge>
                  ) : (
                    <Badge variant="secondary">{t('navigation_config.default_display')}</Badge>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t('navigation_config.fields.role')}
                </label>
                <div className="mt-1 space-y-1">
                  {config.role ? (
                    <>
                      <Badge variant="outline" className="block w-fit">
                        {config.role.name || config.roleId}
                      </Badge>
                      {config.role.description && (
                        <p className="text-xs text-gray-500">{config.role.description}</p>
                      )}
                    </>
                  ) : config.roleId ? (
                    <Badge variant="outline">{config.roleId}</Badge>
                  ) : (
                    <Badge variant="secondary">{t('navigation_config.default_display')}</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Phiên bản</label>
                <div className="mt-1">
                  <Badge variant="outline">{config.version}</Badge>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                {t('navigation_config.fields.status')}
              </label>
              <div className="mt-1">
                {config.isActive ? (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    {t('navigation_config.active')}
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="mr-1 h-3 w-3" />
                    {t('navigation_config.inactive')}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Config Items */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Package className="h-4 w-4" />
              Navigation Items ({itemsCount})
            </label>
            <div className="mt-2 max-h-96 overflow-y-auto rounded-lg border bg-gray-50 p-4">
              <pre className="text-xs">{JSON.stringify(config.config, null, 2)}</pre>
            </div>
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4" />
                {t('navigation_config.fields.created_at')}
              </label>
              <p className="mt-1 text-sm text-gray-600">
                {format(new Date(config.createdAt), 'dd/MM/yyyy HH:mm:ss', {
                  locale: locale === 'vi' ? vi : enUS,
                })}
              </p>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4" />
                {t('navigation_config.fields.updated_at')}
              </label>
              <p className="mt-1 text-sm text-gray-600">
                {format(new Date(config.updatedAt), 'dd/MM/yyyy HH:mm:ss', {
                  locale: locale === 'vi' ? vi : enUS,
                })}
              </p>
            </div>
          </div>
        </div>
      </SystemModalLayout>
    </Dialog>
  )
}
