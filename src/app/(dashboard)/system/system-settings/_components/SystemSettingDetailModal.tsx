'use client'

import React from 'react'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { SystemSetting } from '@/types/system-settings'
import { SystemSettingType } from '@/types/system-settings'
import { Settings, Key, FileText, Calendar, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface Props {
  setting: SystemSetting | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SystemSettingDetailModal({ setting, open, onOpenChange }: Props) {
  const [showSecret, setShowSecret] = React.useState(false)

  if (!setting) return null

  const getTypeColor = (type: SystemSettingType) => {
    switch (type) {
      case SystemSettingType.STRING:
        return 'bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-200)]'
      case SystemSettingType.NUMBER:
        return 'bg-[var(--brand-100)] text-[var(--brand-600)] border-[var(--brand-200)]'
      case SystemSettingType.BOOLEAN:
        return 'bg-[var(--color-success-50)] text-[var(--color-success-500)] border-[var(--color-success-200)]'
      case SystemSettingType.JSON:
        return 'bg-[var(--warning-50)] text-[var(--warning-500)] border-[var(--warning-200)]'
      case SystemSettingType.SECRET:
        return 'bg-[var(--error-50)] text-[var(--error-500)] border-[var(--error-200)]'
      default:
        return 'bg-[var(--neutral-100)] text-[var(--neutral-700)] border-[var(--neutral-200)]'
    }
  }

  const renderValue = () => {
    if (setting.type === SystemSettingType.SECRET) {
      const secretValue =
        typeof setting.value === 'object' ? JSON.stringify(setting.value) : String(setting.value)
      return (
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg bg-gray-100 px-4 py-2 font-mono text-sm">
            {showSecret ? secretValue : '••••••••••••'}
          </code>
          <button
            onClick={() => setShowSecret(!showSecret)}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      )
    }

    if (setting.type === SystemSettingType.JSON) {
      try {
        let jsonValue: unknown
        // If value is already an object, use it directly
        if (typeof setting.value === 'object' && setting.value !== null) {
          jsonValue = setting.value
        } else {
          // If value is a string, try to parse it
          jsonValue = JSON.parse(String(setting.value))
        }
        const formatted = JSON.stringify(jsonValue, null, 2)
        return (
          <pre className="overflow-x-auto rounded-lg bg-gray-100 p-4 font-mono text-sm">
            {formatted}
          </pre>
        )
      } catch {
        // If parsing fails, convert to string safely
        const fallbackValue =
          typeof setting.value === 'object' ? JSON.stringify(setting.value) : String(setting.value)
        return (
          <code className="block rounded-lg bg-gray-100 px-4 py-2 font-mono text-sm">
            {fallbackValue}
          </code>
        )
      }
    }

    if (setting.type === SystemSettingType.BOOLEAN) {
      const boolValue =
        typeof setting.value === 'object' ? JSON.stringify(setting.value) : String(setting.value)
      return (
        <div className="flex items-center gap-2">
          {boolValue === 'true' ? (
            <Badge className="border-[var(--color-success-200)] bg-[var(--color-success-50)] text-[var(--color-success-600)]">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              true
            </Badge>
          ) : (
            <Badge className="border-[var(--color-error-200)] bg-[var(--color-error-50)] text-[var(--color-error-500)]">
              <XCircle className="mr-1 h-3 w-3" />
              false
            </Badge>
          )}
        </div>
      )
    }

    // For other types, safely convert to string
    const displayValue =
      typeof setting.value === 'object' ? JSON.stringify(setting.value) : String(setting.value)
    return (
      <code className="block rounded-lg bg-gray-100 px-4 py-2 font-mono text-sm">
        {displayValue}
      </code>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SystemModalLayout
        title="Chi tiết cấu hình"
        description="Thông tin chi tiết về cấu hình hệ thống"
        icon={Settings}
        variant="view"
      >
        <div className="space-y-6">
          {/* Setting Key */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <Key className="h-4 w-4" />
              Khóa cấu hình
            </div>
            <div className="flex items-center gap-3">
              <code className="flex-1 rounded-lg bg-gray-100 px-4 py-2 font-mono text-sm font-semibold">
                {setting.key}
              </code>
              <Badge className={cn('shrink-0 border', getTypeColor(setting.type))}>
                {setting.type}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Value */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <FileText className="h-4 w-4" />
              Giá trị
            </div>
            {renderValue()}
          </div>

          {/* Description */}
          {setting.description && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <FileText className="h-4 w-4" />
                  Mô tả
                </div>
                <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                  {setting.description}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Status & Timestamps */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                Trạng thái
              </div>
              {setting.isEditable ? (
                <Badge className="border-[var(--color-success-200)] bg-[var(--color-success-50)] text-[var(--color-success-600)]">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Có thể chỉnh sửa
                </Badge>
              ) : (
                <Badge className="border-gray-200 bg-gray-500/10 text-gray-700">
                  <XCircle className="mr-1 h-3 w-3" />
                  Chỉ đọc
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Calendar className="h-4 w-4" />
                Ngày tạo
              </div>
              <p className="text-sm text-gray-700">
                {format(new Date(setting.createdAt), 'PPP', { locale: vi })}
              </p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Calendar className="h-4 w-4" />
                Cập nhật lần cuối
              </div>
              <p className="text-sm text-gray-700">
                {format(new Date(setting.updatedAt), 'PPP p', { locale: vi })}
              </p>
            </div>
          </div>
        </div>
      </SystemModalLayout>
    </Dialog>
  )
}
