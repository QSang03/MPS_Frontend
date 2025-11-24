'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { UserForm } from './UserForm'

interface UserFormModalProps {
  customerId?: string
}

/**
 * User Form in a modal dialog
 */
export function UserFormModal({ customerId = '' }: UserFormModalProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg transition-all duration-300 hover:shadow-xl">
          <Plus className="h-5 w-5" /> Thêm người dùng
        </Button>
      </DialogTrigger>

      <AnimatePresence>
        {open && (
          <DialogContent className="max-h-[90vh] w-full sm:max-w-3xl">
            <div className="flex min-h-[40px] flex-col">
              <DialogHeader className="sticky top-0 z-30 border-b bg-white/90 px-6 py-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-lg p-2">
                    <Users className="text-primary h-6 w-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold">Tạo người dùng mới</DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm">
                      Điền thông tin chi tiết để tạo tài khoản người dùng
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <UserForm
                  customerId={customerId}
                  mode="create"
                  onSuccess={() => {
                    setOpen(false)
                    router.refresh()
                  }}
                />
              </div>
            </div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
