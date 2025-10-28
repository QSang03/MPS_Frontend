'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { consumableTypesClientService } from '@/lib/api/services/consumable-types-client.service'
import type { ConsumableType, CreateConsumableTypeDto } from '@/types/models/consumable-type'

interface Props {
  mode?: 'create' | 'edit'
  model?: ConsumableType | null
  onSaved?: (m?: ConsumableType | null) => void
}

export default function ConsumableTypeFormModal({ mode = 'create', model = null, onSaved }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<CreateConsumableTypeDto>({
    name: model?.name || '',
    description: model?.description || '',
    unit: model?.unit || '',
    isActive: model?.isActive ?? true,
  })

  React.useEffect(() => {
    if (model) {
      setForm({
        name: model.name || '',
        description: model.description || '',
        unit: model.unit || '',
        isActive: model.isActive ?? true,
      })
    }
  }, [model])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setLoading(true)
    try {
      if (mode === 'create') {
        const created = await consumableTypesClientService.create(form)
        onSaved?.(created || null)
      } else if (model) {
        const updated = await consumableTypesClientService.update(model.id, form)
        onSaved?.(updated || null)
      }
      setOpen(false)
    } catch (err: unknown) {
      const e = err as Error
      console.error('Save consumable type failed', e)
      // show toast if sonner available
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={mode === 'create' ? 'default' : 'ghost'} size="sm">
          {mode === 'create' ? 'Thêm loại vật tư' : 'Sửa'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Thêm loại vật tư tiêu hao' : 'Sửa loại vật tư tiêu hao'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tên</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mô tả</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Đơn vị</label>
            <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={form.isActive}
              onCheckedChange={(v: boolean) => setForm({ ...form, isActive: v })}
            />
            <span>Hoạt động</span>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
