'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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
        return 'bg-blue-500/10 text-blue-700 border-blue-200'
      case SystemSettingType.NUMBER:
        return 'bg-purple-500/10 text-purple-700 border-purple-200'
      case SystemSettingType.BOOLEAN:
        return 'bg-green-500/10 text-green-700 border-green-200'
      case SystemSettingType.JSON:
        return 'bg-orange-500/10 text-orange-700 border-orange-200'
      case SystemSettingType.SECRET:
        return 'bg-red-500/10 text-red-700 border-red-200'
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200'
    }
  }

  const renderValue = () => {
    if (setting.type === SystemSettingType.SECRET) {
      return (
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg bg-gray-100 px-4 py-2 font-mono text-sm">
            {showSecret ? setting.value : '••••••••••••'}
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
        const formatted = JSON.stringify(JSON.parse(setting.value), null, 2)
        return (
          <pre className="overflow-x-auto rounded-lg bg-gray-100 p-4 font-mono text-sm">
            {formatted}
          </pre>
        )
      } catch {
        return (
          <code className="block rounded-lg bg-gray-100 px-4 py-2 font-mono text-sm">
            {setting.value}
          </code>
        )
      }
    }

    if (setting.type === SystemSettingType.BOOLEAN) {
      return (
        <div className="flex items-center gap-2">
          {setting.value === 'true' ? (
            <Badge className="border-green-200 bg-green-500/10 text-green-700">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              true
            </Badge>
          ) : (
            <Badge className="border-red-200 bg-red-500/10 text-red-700">
              <XCircle className="mr-1 h-3 w-3" />
              false
            </Badge>
          )}
        </div>
      )
    }

    return (
      <code className="block rounded-lg bg-gray-100 px-4 py-2 font-mono text-sm">
        {setting.value}
      </code>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
        {/* Header with Gradient */}
        <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-0">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6" />
              <DialogTitle className="text-2xl font-bold">Chi tiết cấu hình</DialogTitle>
            </div>
            <DialogDescription className="mt-2 text-white/90">
              Thông tin chi tiết về cấu hình hệ thống
            </DialogDescription>
          </div>
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
        </DialogHeader>

        <div className="space-y-6 p-6">
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
                <Badge className="border-green-200 bg-green-500/10 text-green-700">
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
      </DialogContent>
    </Dialog>
  )
}
