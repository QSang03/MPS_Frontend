'use client'

import { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

export interface SlaTemplateFormValues {
  name: string
  description?: string | null
  isActive?: boolean
  // JSON array string for items: for now, a simple JSON input to avoid full dedicated UI
  itemsJson?: string
}

export function SlaTemplateFormDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  submitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues?: SlaTemplateFormValues | null
  onSubmit: (values: SlaTemplateFormValues) => Promise<void>
  submitting?: boolean
}) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [isActive, setIsActive] = useState<boolean>(Boolean(initialValues?.isActive))
  const [itemsJson, setItemsJson] = useState(initialValues?.itemsJson ?? '[]')
  const [jsonError, setJsonError] = useState<string | null>(null)

  // NOTE: We rely on the parent passing a unique `key` prop to remount
  // this component when `initialValues` changes to avoid setting state
  // in an effect (which can cause cascade renders).

  const handleSave = async () => {
    // Validate name
    if (!name || name.trim() === '') return
    // Validate itemsJson is valid JSON array
    try {
      const parsed = JSON.parse(itemsJson || '[]')
      if (!Array.isArray(parsed)) {
        setJsonError('Items must be a JSON array')
        return
      }
      setJsonError(null)
    } catch {
      setJsonError('Items must be valid JSON')
      return
    }

    await onSubmit({
      name: name.trim(),
      description: description || undefined,
      isActive,
      itemsJson,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SystemModalLayout
        title={initialValues ? 'Chỉnh sửa SLA template' : 'Tạo SLA template'}
        description={initialValues ? 'Cập nhật template SLA' : 'Tạo template SLA mới'}
        icon={undefined}
        variant="create"
        footer={
          <>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button onClick={() => handleSave()} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu'
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Tên template</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label className="text-sm font-medium">Mô tả</Label>
            <Input
              value={description ?? ''}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Kích hoạt</Label>
            <div className="mt-2">
              <Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(!!v)} />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Items (JSON array)</Label>
            <Textarea
              value={itemsJson}
              onChange={(e) => setItemsJson(e.target.value)}
              className="mt-2 h-40"
            />
            {jsonError && <p className="mt-1 text-xs text-red-600">{jsonError}</p>}
            <p className="text-muted-foreground mt-1 text-xs">
              Directory of items in JSON format: [
              {
                '{"priority":"NORMAL","responseTimeHours":24,"resolutionTimeHours":72,"name":"...","description":"..."}'
              }
              ]
            </p>
          </div>
        </div>
      </SystemModalLayout>
    </Dialog>
  )
}

export default SlaTemplateFormDialog
