'use client'

import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
      <AlertDialogContent className="max-w-lg overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
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

        <div className="bg-white px-6 py-5">
          <p className="text-sm text-gray-600">Hãy xác nhận để tiếp tục.</p>
        </div>

        <AlertDialogFooter className="border-t bg-gray-50 px-6 py-4">
          <AlertDialogCancel disabled={isConfirming} className="min-w-[100px]">
            <X className="mr-2 h-4 w-4" />
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isConfirming}
            className="min-w-[120px] bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
          >
            {isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
