'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Key } from 'lucide-react'
import {
  adminChangePasswordSchema,
  type AdminChangePasswordFormData,
} from '@/lib/validations/user.schema'
import { usersClientService } from '@/lib/api/services/users-client.service'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import type { User } from '@/types/users'
import { removeEmpty } from '@/lib/utils/clean'

interface Props {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onPasswordChanged?: (userId: string) => void
}

export default function ChangeUserPasswordModal({
  user,
  isOpen,
  onClose,
  onPasswordChanged,
}: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<AdminChangePasswordFormData>({
    resolver: zodResolver(adminChangePasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const onSubmit = async (data: AdminChangePasswordFormData) => {
    if (!user) return
    setIsLoading(true)
    try {
      // Use existing usersClientService updateUser to set password
      await usersClientService.updateUser(user.id, removeEmpty({ password: data.newPassword }))
      toast.success('Đổi mật khẩu thành công')
      // Invalidate users list to reflect any server-side changes
      queryClient.invalidateQueries({ queryKey: ['users'] })
      if (onPasswordChanged) onPasswordChanged(user.id)
      form.reset()
      onClose()
    } catch (err) {
      console.error('Change user password error', err)
      const message = err instanceof Error ? err.message : 'Có lỗi khi đổi mật khẩu'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetToDefault = async () => {
    if (!user) return
    const defaultPass = process.env.NEXT_PUBLIC_DEFAULT_USER_PASSWORD || ''
    if (!defaultPass) {
      toast.error('Mật khẩu mặc định chưa được cấu hình')
      return
    }
    setIsLoading(true)
    try {
      await usersClientService.updateUser(user.id, removeEmpty({ password: defaultPass }))
      toast.success('Đặt lại mật khẩu về mặc định thành công')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      if (onPasswordChanged) onPasswordChanged(user.id)
      onClose()
    } catch (err) {
      console.error('Reset user password error', err)
      const message = err instanceof Error ? err.message : 'Có lỗi khi reset mật khẩu'
      toast.error(message)
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
      <DialogContent className="max-w-sm overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2">
              <Key className="h-5 w-5 text-white" />
            </div>
            <DialogTitle className="text-white">Đổi mật khẩu người dùng</DialogTitle>
          </div>
        </DialogHeader>

        <div className="bg-gradient-to-b from-gray-50 to-white p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700">Người dùng</div>
                <div className="text-sm text-gray-500">{user?.email || '—'}</div>
              </div>
              <div className="space-y-4">
                <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-gray-800">Mật khẩu mặc định</div>
                      <div className="text-sm text-gray-600">
                        {process.env.NEXT_PUBLIC_DEFAULT_USER_PASSWORD
                          ? process.env.NEXT_PUBLIC_DEFAULT_USER_PASSWORD
                          : 'Chưa cấu hình'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          // confirm then reset
                          if (!confirm('Bạn có chắc muốn đặt lại mật khẩu về mặc định không?'))
                            return
                          handleResetToDefault()
                        }}
                        disabled={isLoading}
                      >
                        Đặt lại về mặc định
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="text-sm font-medium text-gray-700">Hoặc đặt mật khẩu tuỳ chỉnh</div>

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu mới</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Nhập mật khẩu mới" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Xác nhận mật khẩu</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Xác nhận mật khẩu mới" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                    Hủy
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      'Lưu mật khẩu'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
