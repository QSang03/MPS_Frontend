'use client'

import { useState } from 'react'
import { Loader2, Trash2, AlertTriangle, X } from 'lucide-react'
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

interface DeleteDialogProps {
  title: string
  description: string
  onConfirm: () => Promise<void>
  trigger?: React.ReactNode
}

export function DeleteDialog({ title, description, onConfirm, trigger }: DeleteDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      setIsOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm" className="gap-2">
            <Trash2 className="h-4 w-4" />
            Xóa
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg overflow-hidden rounded-lg border p-0 shadow-lg">
        {/* Header */}
        <div className="border-b px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-error-50)]">
                <AlertTriangle className="h-5 w-5 text-[var(--color-error-500)]" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <AlertDialogHeader className="space-y-2 text-left">
                <AlertDialogTitle className="text-foreground text-xl font-bold">
                  {title}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  {description}
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-background px-6 py-5">
          <div className="flex items-start gap-3 rounded-lg border border-[var(--color-error-200)] bg-[var(--color-error-50)] p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-error-500)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-error-600)]">
                Cảnh báo: Hành động không thể hoàn tác
              </p>
              <p className="mt-1 text-xs text-[var(--color-error-500)]">
                Dữ liệu sẽ bị xóa vĩnh viễn và không thể khôi phục.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <AlertDialogFooter className="bg-muted/50 border-t px-6 py-4">
          <AlertDialogCancel disabled={isDeleting} className="min-w-[100px]">
            <X className="mr-2 h-4 w-4" />
            Hủy
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="min-w-[120px]"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Xác nhận xóa
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
