'use client'

import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
// Removed unused AlertDialogAction import
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => Promise<void>
  trigger?: React.ReactNode
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  onConfirm,
  trigger,
}: ConfirmDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm()
      setIsOpen(false)
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{trigger || <Button>{confirmLabel}</Button>}</AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg overflow-hidden rounded-lg border p-0 shadow-lg">
        <div className="px-6 py-5">
          <AlertDialogHeader className="space-y-2 text-left">
            <AlertDialogTitle className="text-lg font-bold">{title}</AlertDialogTitle>
            {description ? (
              <AlertDialogDescription className="text-muted-foreground text-sm">
                {description}
              </AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
        </div>

        <div className="bg-background px-6 py-5">
          <p className="text-muted-foreground text-sm">Hãy xác nhận để tiếp tục.</p>
        </div>

        <AlertDialogFooter className="bg-muted/50 border-t px-6 py-4">
          <AlertDialogCancel disabled={isConfirming} className="min-w-[100px]">
            <X className="mr-2 h-4 w-4" />
            {cancelLabel}
          </AlertDialogCancel>
          <Button onClick={handleConfirm} disabled={isConfirming} className="min-w-[120px]">
            {isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
