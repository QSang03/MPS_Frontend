'use client'

import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Edit, Trash2 } from 'lucide-react'
import type { NavigationConfig } from '@/types/navigation-config'
import { format } from 'date-fns'
import { vi, enUS } from 'date-fns/locale'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ActionGuard } from '@/components/shared/ActionGuard'

interface Props {
  configs: NavigationConfig[]
  onView: (config: NavigationConfig) => void
  onEdit: (config: NavigationConfig) => void
  onDelete: (config: NavigationConfig) => void
}

export default function NavigationConfigTable({ configs, onView, onEdit, onDelete }: Props) {
  const { t, locale } = useLocale()
  if (configs.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        <p>{t('navigation_config.empty')}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('navigation_config.fields.name')}</TableHead>
            <TableHead>{t('navigation_config.fields.description')}</TableHead>
            <TableHead>{t('navigation_config.fields.customer')}</TableHead>
            <TableHead>{t('navigation_config.fields.role')}</TableHead>
            <TableHead>{t('navigation_config.fields.version')}</TableHead>
            <TableHead>{t('navigation_config.fields.status')}</TableHead>
            <TableHead>{t('navigation_config.fields.created_at')}</TableHead>
            <TableHead>{t('navigation_config.fields.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {configs.map((config) => (
            <TableRow key={config.id}>
              <TableCell className="font-medium">{config.name}</TableCell>
              <TableCell className="max-w-xs truncate">{config.description || '-'}</TableCell>
              <TableCell>
                {config.customer ? (
                  <Badge variant="outline">
                    {config.customer.name || config.customer.code || config.customerId}
                  </Badge>
                ) : config.customerId ? (
                  <Badge variant="outline">{config.customerId}</Badge>
                ) : (
                  <Badge variant="secondary">{t('navigation_config.default_display')}</Badge>
                )}
              </TableCell>
              <TableCell>
                {config.role ? (
                  <Badge variant="outline">{config.role.name || config.roleId}</Badge>
                ) : config.roleId ? (
                  <Badge variant="outline">{config.roleId}</Badge>
                ) : (
                  <Badge variant="secondary">{t('navigation_config.default_display')}</Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{config.version}</Badge>
              </TableCell>
              <TableCell>
                {config.isActive ? (
                  <Badge className="bg-green-100 text-green-700">
                    {t('navigation_config.active')}
                  </Badge>
                ) : (
                  <Badge variant="secondary">{t('navigation_config.inactive')}</Badge>
                )}
              </TableCell>
              <TableCell>
                {format(new Date(config.createdAt), 'dd/MM/yyyy HH:mm', {
                  locale: locale === 'vi' ? vi : enUS,
                })}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onView(config)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <ActionGuard pageId="navigation-configs" actionId="update">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onEdit(config)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </ActionGuard>
                  <ActionGuard pageId="navigation-configs" actionId="delete">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(config)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </ActionGuard>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
