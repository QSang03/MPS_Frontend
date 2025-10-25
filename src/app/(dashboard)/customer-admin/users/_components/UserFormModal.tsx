'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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
  customerId?: string // ✅ FIX: Thay từ required string thành optional
}

/**
 * User Form in a modal dialog
 */
export function UserFormModal({ customerId = '' }: UserFormModalProps) {
  // ✅ FIX: Thêm default value = '' để đảm bảo luôn là string
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button className="gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 font-bold text-white shadow-lg transition-all duration-300 hover:from-purple-700 hover:to-pink-700 hover:shadow-xl">
            <Plus className="h-5 w-5" />➕ Thêm người dùng
          </Button>
        </motion.div>
      </DialogTrigger>

      <AnimatePresence>
        {open && (
          <DialogContent className="max-h-[90vh] overflow-hidden overflow-y-auto rounded-2xl border-0 p-0 shadow-2xl sm:max-w-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {/* Premium Header */}
              <DialogHeader className="relative overflow-hidden border-0 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 p-0">
                {/* Animated background shapes */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 right-0 h-40 w-40 translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
                </div>

                <div className="relative px-8 py-6">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="rounded-xl border border-white/30 bg-white/20 p-2.5 backdrop-blur-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <DialogTitle className="text-2xl font-bold text-white">
                      ➕ Tạo người dùng mới
                    </DialogTitle>
                  </div>
                  <DialogDescription className="text-sm font-medium text-pink-100">
                    Điền thông tin chi tiết để tạo tài khoản người dùng
                  </DialogDescription>
                </div>
              </DialogHeader>

              {/* Form Content */}
              <div className="mt-6 bg-gradient-to-b from-gray-50 to-white px-8 py-6">
                <UserForm
                  customerId={customerId} // ✅ Luôn là string (không bao giờ undefined)
                  mode="create"
                  onSuccess={() => {
                    setOpen(false)
                    // Refresh current route so server data is re-fetched and the new user appears
                    router.refresh()
                  }}
                />
              </div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
