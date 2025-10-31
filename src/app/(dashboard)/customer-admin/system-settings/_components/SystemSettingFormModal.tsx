'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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

  const [form, setForm] = useState<SystemSettingFormData>({
    value: setting.value || '',
    description: setting.description || '',
  })

  React.useEffect(() => {
    if (setting) {
      setForm({
        value: setting.value || '',
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
            className="transition-all focus:ring-2 focus:ring-blue-500"
          />
        )
      case SystemSettingType.BOOLEAN:
        return (
          <select
            id="value"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            className="border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-all focus:ring-2 focus:ring-blue-500"
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
            className="font-mono text-sm transition-all focus:ring-2 focus:ring-blue-500"
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
            className="transition-all focus:ring-2 focus:ring-red-500"
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
            className="transition-all focus:ring-2 focus:ring-blue-500"
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
        <Button variant="outline" size="sm" className="gap-2 hover:bg-blue-50">
          <Edit className="h-4 w-4" />
          Chỉnh sửa
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[700px] overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
        {/* Header with Gradient */}
        <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-0">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6" />
              <DialogTitle className="text-2xl font-bold">Chỉnh sửa cấu hình hệ thống</DialogTitle>
            </div>
            <DialogDescription className="mt-2 text-white/90">
              Cập nhật giá trị và mô tả cho cấu hình hệ thống
            </DialogDescription>
          </div>
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
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
              className="transition-all focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Separator />

          {/* Footer */}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
              className="transition-all hover:bg-gray-100"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !form.value}
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 transition-all hover:from-blue-700 hover:to-indigo-700"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4" />
                  Cập nhật
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
