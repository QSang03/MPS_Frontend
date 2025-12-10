'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Package } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

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
  const { t } = useLocale()
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
        title={t('consumable_types.stock.edit_title')}
        description={t('consumable_types.stock.edit_description', { name: consumableName })}
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
              {t('cancel')}
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
                  {t('button.saving')}
                </>
              ) : (
                t('department.button.save_changes')
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">{t('consumable_types.stock.label.quantity')}</Label>
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
            <Label htmlFor="threshold">{t('consumable_types.stock.label.threshold')}</Label>
            <Input
              id="threshold"
              type="number"
              min="0"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              disabled={saving}
            />
            <p className="text-muted-foreground text-xs">
              {t('consumable_types.stock.helper.threshold_note')}
            </p>
          </div>
        </div>
      </SystemModalLayout>
    </Dialog>
  )
}
