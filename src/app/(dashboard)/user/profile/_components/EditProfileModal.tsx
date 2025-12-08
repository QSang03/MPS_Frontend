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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, User, Edit, Phone } from 'lucide-react'
import type { UserProfile } from '@/types/auth'
import internalApiClient from '@/lib/api/internal-client'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'

// Validation schema for editing profile
const editProfileSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
})

type EditProfileFormData = z.infer<typeof editProfileSchema>

interface EditProfileModalProps {
  profile: UserProfile | null
  isOpen: boolean
  onClose: () => void
  onProfileUpdated: (updatedProfile: UserProfile) => void
}

export function EditProfileModal({
  profile,
  isOpen,
  onClose,
  onProfileUpdated,
}: EditProfileModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useLocale()

  const form = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: '',
      phone: '',
    },
  })

  // Update form when profile changes
  useEffect(() => {
    if (profile?.user) {
      const attrs = (profile.user.attributes as Record<string, unknown> | undefined) || {}
      form.reset({
        name: (attrs.name as string) || '',
        phone: (attrs.phone as string) || '',
      })
    }
  }, [profile, form])

  const onSubmit = async (data: EditProfileFormData) => {
    if (!profile) return

    setIsLoading(true)
    try {
      const payload = {
        attributes: {
          name: data.name?.trim() || undefined,
          phone: data.phone?.trim() || undefined,
        },
      }

      // Remove undefined attributes and omit attributes if empty
      const attrs = payload.attributes as Record<string, unknown>
      const cleanedAttrs = Object.fromEntries(
        Object.entries(attrs).filter(
          ([, value]) => value !== undefined && String(value).trim() !== ''
        )
      )
      const cleanedPayload: Record<string, unknown> = {}
      if (Object.keys(cleanedAttrs).length) cleanedPayload.attributes = cleanedAttrs

      // Call internal API via Next.js route so cookies (httpOnly) are included
      const resp = await internalApiClient.patch('/api/profile', cleanedPayload)
      const updatedProfile = resp.data && resp.data.data ? resp.data.data : resp.data

      toast.success(t('user.update_success'))
      onProfileUpdated(updatedProfile)
      onClose()
    } catch (error) {
      console.error('Error updating profile:', error)
      const err = error as { response?: { data?: { message?: string; error?: string } } }
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Có lỗi xảy ra khi cập nhật hồ sơ'

      // Handle field errors if available
      if (err?.response?.data && typeof err.response.data === 'object') {
        const errorData = err.response.data as Record<string, unknown>
        if (errorData.errors && typeof errorData.errors === 'object') {
          Object.entries(errorData.errors).forEach(([field, messages]) => {
            const message = Array.isArray(messages) ? String(messages[0]) : String(messages)
            if (['name', 'phone'].includes(field)) {
              form.setError(field as keyof EditProfileFormData, { type: 'server', message })
            }
          })
          toast.error(t('validation.fields_error'))
          return
        }
      }

      toast.error(`❌ ${message}`)
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
      <DialogContent className="max-w-[550px] overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
        {/* Premium Header */}
        <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-[var(--brand-600)] via-[var(--brand-700)] to-[var(--brand-700)] p-0">
          {/* Animated background shapes */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 h-40 w-40 translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
          </div>

          <div className="relative px-8 py-6">
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-xl border border-white/30 bg-white/20 p-2.5 backdrop-blur-lg">
                <Edit className="h-6 w-6 text-white" />
              </div>
              <DialogTitle className="text-2xl font-bold text-white">Chỉnh sửa hồ sơ</DialogTitle>
            </div>
            <DialogDescription className="text-sm font-medium text-pink-100">
              Cập nhật thông tin cá nhân của bạn
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Form Content */}
        <div className="space-y-5 bg-gradient-to-b from-gray-50 to-white px-8 py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Name Field (attributes.name) */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-bold text-gray-800">
                      <User className="h-4 w-4 text-rose-600" />
                      Tên
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nhập tên"
                        {...field}
                        className="h-10 rounded-lg border-2 border-gray-200 text-base transition-all focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                      />
                    </FormControl>
                    <FormMessage className="mt-1 text-xs text-red-600" />
                  </FormItem>
                )}
              />

              {/* Phone Field (attributes.phone) */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-bold text-gray-800">
                      <Phone className="h-4 w-4 text-[var(--brand-600)]" />
                      Điện thoại
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nhập số điện thoại"
                        {...field}
                        className="h-10 rounded-lg border-2 border-gray-200 text-base transition-all focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-200)]"
                      />
                    </FormControl>
                    <FormMessage className="mt-1 text-xs text-red-600" />
                  </FormItem>
                )}
              />

              {/* Info card */}
              <div className="rounded-lg border-2 border-[var(--brand-200)] bg-gradient-to-r from-[var(--brand-50)] to-[var(--brand-100)] p-4">
                <p className="text-xs text-gray-700">
                  <span className="font-bold text-[var(--brand-700)]">💡 Tip:</span> Các thay đổi sẽ
                  được lưu ngay khi bạn nhấn "Cập nhật".
                </p>
              </div>

              {/* Form Footer */}
              <div className="mt-6 flex gap-3 border-t-2 border-gray-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 rounded-lg border-2 border-gray-300 font-medium transition-all hover:border-gray-400 hover:bg-gray-50"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="min-w-[120px] flex-1 rounded-lg bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-700)] font-bold text-white shadow-lg transition-all hover:from-[var(--brand-700)] hover:to-[var(--brand-700)] hover:shadow-xl disabled:opacity-50"
                >
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
