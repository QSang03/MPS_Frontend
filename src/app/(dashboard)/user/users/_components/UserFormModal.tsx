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
          <DialogContent className="max-h-[90vh] overflow-hidden overflow-y-auto sm:max-w-2xl">
            <DialogHeader className="border-b px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-lg p-2">
                  <Users className="text-primary h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">Tạo người dùng mới</DialogTitle>
                  <DialogDescription>
                    Điền thông tin chi tiết để tạo tài khoản người dùng
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Form Content */}
            <div className="px-6 py-6">
              <UserForm
                customerId={customerId}
                mode="create"
                onSuccess={() => {
                  setOpen(false)
                  router.refresh()
                }}
              />
            </div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
