'use client'

import { useState } from 'react'
import { Loader2, Trash2, AlertTriangle, X } from 'lucide-react'
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
      <AlertDialogContent className="max-w-lg overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
        {/* Header with gradient danger background */}
        <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 px-6 py-5">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/30 backdrop-blur-sm">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>

            <div className="min-w-0 flex-1 text-white">
              <AlertDialogHeader className="space-y-2 text-left">
                <AlertDialogTitle className="text-xl font-bold text-white">
                  {title}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-white/90">
                  {description}
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white px-6 py-5">
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-900">
                Cảnh báo: Hành động không thể hoàn tác
              </p>
              <p className="mt-1 text-xs text-red-700">
                Dữ liệu sẽ bị xóa vĩnh viễn và không thể khôi phục.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <AlertDialogFooter className="border-t bg-gray-50 px-6 py-4">
          <AlertDialogCancel disabled={isDeleting} className="min-w-[100px]">
            <X className="mr-2 h-4 w-4" />
            Hủy
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="min-w-[120px] bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700"
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
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
