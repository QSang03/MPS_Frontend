'use client'

import React, { useState } from 'react'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import type { SystemSetting, SystemSettingFormData } from '@/types/system-settings'
import { SystemSettingType } from '@/types/system-settings'
import { Edit, Loader2, Settings, Lock, FileText, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { updateSystemSetting } from '@/lib/api/system-settings'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface Props {
  setting: SystemSetting
  onSaved?: (setting: SystemSetting) => void
}

export default function SystemSettingFormModal({ setting, onSaved }: Props) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const getInitialValue = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2)
      } catch {
        return String(value)
      }
    }
    return String(value)
  }

  const [form, setForm] = useState<SystemSettingFormData>({
    value: getInitialValue(setting.value),
    description: setting.description || '',
  })

  React.useEffect(() => {
    if (setting) {
      setForm({
        value: getInitialValue(setting.value),
        description: setting.description || '',
      })
    }
  }, [setting])

  const mutation = useMutation({
    mutationFn: (data: SystemSettingFormData) => updateSystemSetting(setting.id, data),
    onSuccess: (response) => {
      toast.success('Cập nhật cấu hình thành công')
      queryClient.invalidateQueries({ queryKey: ['system-settings'] })
      onSaved?.(response.data)
      setOpen(false)
    },
    onError: (error: Error) => {
      console.error('Update system setting failed', error)
      toast.error('Có lỗi khi cập nhật cấu hình')
    },
  })

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    mutation.mutate(form)
  }

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

  const renderValueInput = () => {
    switch (setting.type) {
      case SystemSettingType.NUMBER:
        return (
          <Input
            id="value"
            type="number"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            placeholder="Nhập giá trị số"
            className="transition-all focus:ring-2 focus:ring-[var(--brand-500)]"
          />
        )
      case SystemSettingType.BOOLEAN:
        return (
          <select
            id="value"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            className="border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-all focus:ring-2 focus:ring-[var(--ring)]"
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        )
      case SystemSettingType.JSON:
        return (
          <Textarea
            id="value"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            placeholder='{"key": "value"}'
            rows={6}
            className="font-mono text-sm transition-all focus:ring-2 focus:ring-[var(--ring)]"
          />
        )
      case SystemSettingType.SECRET:
        return (
          <Input
            id="value"
            type="password"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            placeholder="Nhập giá trị bảo mật"
            className="transition-all focus:ring-2 focus:ring-[var(--error-500)]"
          />
        )
      default:
        return (
          <Input
            id="value"
            type="text"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            placeholder="Nhập giá trị"
            className="transition-all focus:ring-2 focus:ring-[var(--ring)]"
          />
        )
    }
  }

  if (!setting.isEditable) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 hover:bg-[var(--brand-50)]">
          <Edit className="h-4 w-4" />
          Chỉnh sửa
        </Button>
      </DialogTrigger>

      <SystemModalLayout
        title="Chỉnh sửa cấu hình hệ thống"
        description="Cập nhật giá trị và mô tả cho cấu hình hệ thống"
        icon={Settings}
        variant="edit"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
              className="min-w-[100px]"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              form="system-setting-form"
              disabled={mutation.isPending || !form.value}
              className="min-w-[120px] bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Settings className="mr-2 h-4 w-4" />
                  Cập nhật
                </>
              )}
            </Button>
          </>
        }
      >
        <form id="system-setting-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Setting Key (Read-only) */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="h-4 w-4" />
              Khóa cấu hình
            </Label>
            <div className="flex items-center gap-3">
              <Input
                value={setting.key}
                disabled
                className="bg-gray-50 font-mono text-sm font-semibold"
              />
              <Badge className={cn('shrink-0 border', getTypeColor(setting.type))}>
                {setting.type}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Value Field */}
          <div className="space-y-3">
            <Label
              htmlFor="value"
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              {setting.type === SystemSettingType.SECRET ? (
                <Lock className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Giá trị
              <span className="text-red-500">*</span>
            </Label>
            {renderValueInput()}
            {setting.type === SystemSettingType.JSON && (
              <p className="text-xs text-gray-500">
                <Info className="inline h-3 w-3" /> Nhập JSON hợp lệ
              </p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-3">
            <Label
              htmlFor="description"
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <FileText className="h-4 w-4" />
              Mô tả
            </Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Nhập mô tả chi tiết cho cấu hình này"
              rows={3}
              className="transition-all focus:ring-2 focus:ring-[var(--brand-500)]"
            />
          </div>

          <Separator />
        </form>
      </SystemModalLayout>
    </Dialog>
  )
}
