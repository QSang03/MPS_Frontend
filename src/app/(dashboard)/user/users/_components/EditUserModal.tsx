'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, User, Mail } from 'lucide-react'
import { usersClientService } from '@/lib/api/services/users-client.service'
import type { User as UserType } from '@/types/users'
import { toast } from 'sonner'

// Validation schema for editing user
const editUserSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  roleId: z.string().min(1, 'Vai trò là bắt buộc'),
  customerId: z.string().optional(),
  departmentId: z.string().optional(),
})

type EditUserFormData = z.infer<typeof editUserSchema>

interface EditUserModalProps {
  user: UserType | null
  isOpen: boolean
  onClose: () => void
  onUserUpdated: (updatedUser: UserType) => void
  customerCodes?: string[]
  customerCodeToId?: Record<string, string>
}

export function EditUserModal({
  user,
  isOpen,
  onClose,
  onUserUpdated,
  customerCodes = [],
  customerCodeToId = {},
}: EditUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      email: '',
      roleId: '',
      customerId: '',
      departmentId: '',
    },
  })

  // (no auxiliary lists needed here)

  // Update form when user changes
  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email,
        roleId: user.roleId,
        customerId: user.customerId || '',
        departmentId: user.departmentId || '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const onSubmit = async (data: EditUserFormData) => {
    if (!user) return

    setIsLoading(true)
    try {
      // Ensure we send a proper customerId
      let customerIdToSend: string | undefined = data.customerId || undefined
      if (customerIdToSend && customerCodeToId[customerIdToSend]) {
        customerIdToSend = customerCodeToId[customerIdToSend]
      }

      // Build payload
      const payload: Record<string, unknown> = {
        email: data.email,
        roleId: data.roleId,
      }

      if (customerIdToSend) {
        payload.customerId = customerIdToSend
      }

      if (data.departmentId) {
        payload.departmentId = data.departmentId
      }
      // Update user
      const updatedUser = await usersClientService.updateUser(user.id, payload)

      toast.success('✅ Cập nhật thông tin người dùng thành công')
      onUserUpdated(updatedUser)
      onClose()
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('❌ Có lỗi xảy ra khi cập nhật thông tin người dùng')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[550px] overflow-hidden rounded-lg border p-0 shadow-lg">
        {/* Header */}
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <User className="text-primary h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Chỉnh sửa người dùng</DialogTitle>
              <DialogDescription>Cập nhật thông tin và phân quyền cho người dùng</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Form Content */}
        <div className="bg-background space-y-5 px-6 py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-medium">
                      <Mail className="text-muted-foreground h-4 w-4" />
                      Email *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập email người dùng" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Customer Field */}
              {customerCodes.length > 0 && (
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-medium">
                        <span className="text-lg">🏪</span>
                        Mã khách hàng
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn mã khách hàng">
                              {field.value &&
                                Object.entries(customerCodeToId).find(
                                  ([, id]) => id === field.value
                                )?.[0]}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customerCodes.map((code) => (
                            <SelectItem key={code} value={customerCodeToId[code] || code}>
                              <span className="bg-muted text-muted-foreground inline-block rounded px-2 py-0.5 text-xs font-bold">
                                {code}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Info card */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs text-blue-700">
                  <span className="font-bold">💡 Tip:</span> Các thay đổi sẽ được lưu ngay khi bạn
                  nhấn "Cập nhật".
                </p>
              </div>

              {/* Form Footer */}
              <div className="mt-6 flex gap-3 border-t pt-4">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Hủy
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>💾 Cập nhật</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
