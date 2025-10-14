'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DeviceForm } from './DeviceForm'
import type { Device } from '@/types/models/device'

interface DeviceEditModalProps {
  device: Device
  customerId: string
}

/**
 * Device Edit Form in a modal dialog
 */
export function DeviceEditModal({ device, customerId }: DeviceEditModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Edit className="mr-2 h-4 w-4" />
          Chỉnh sửa
        </Button>
      </DialogTrigger>

      <AnimatePresence>
        {open && (
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <DialogTitle className="font-display text-2xl font-bold">
                  Chỉnh sửa thiết bị
                </DialogTitle>
                <DialogDescription>
                  Cập nhật thông tin cho thiết bị {device.serialNumber}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6">
                <DeviceForm
                  mode="edit"
                  customerId={customerId}
                  initialData={device}
                  onSuccess={() => setOpen(false)}
                />
              </div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
