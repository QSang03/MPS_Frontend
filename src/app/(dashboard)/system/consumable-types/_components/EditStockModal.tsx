'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Package } from 'lucide-react'
import { Loader2 } from 'lucide-react'

interface EditStockModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stockId: string
  consumableName: string
  currentQuantity: number
  currentThreshold: number
  onSave: (stockId: string, quantity: number, threshold: number) => Promise<void>
}

export function EditStockModal({
  open,
  onOpenChange,
  stockId,
  consumableName,
  currentQuantity,
  currentThreshold,
  onSave,
}: EditStockModalProps) {
  const [quantity, setQuantity] = useState(currentQuantity)
  const [threshold, setThreshold] = useState(currentThreshold)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setQuantity(currentQuantity)
      setThreshold(currentThreshold)
    }
  }, [open, currentQuantity, currentThreshold])

  const handleSave = async () => {
    if (quantity < 0 || threshold < 0) {
      return
    }

    setSaving(true)
    try {
      await onSave(stockId, quantity, threshold)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SystemModalLayout
        title="Chỉnh sửa thông tin tồn kho"
        description={`Cập nhật số lượng tồn và ngưỡng cảnh báo cho ${consumableName}`}
        icon={Package}
        variant="edit"
        maxWidth="!max-w-[60vw]"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="min-w-[100px]"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="min-w-[120px] bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Số lượng tồn</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="threshold">Ngưỡng cảnh báo thấp</Label>
            <Input
              id="threshold"
              type="number"
              min="0"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              disabled={saving}
            />
            <p className="text-muted-foreground text-xs">
              Khi số lượng tồn {'<='} ngưỡng này, sẽ hiển thị cảnh báo màu đỏ
            </p>
          </div>
        </div>
      </SystemModalLayout>
    </Dialog>
  )
}
