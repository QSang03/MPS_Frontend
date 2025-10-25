'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Loader2, CheckCircle2, AlertCircle, Layers } from 'lucide-react'
// Checkbox removed: not used in this component
import type { UserRole } from '@/types/users'

const roleSchema = z.object({
  name: z.string().min(1, 'Tên vai trò là bắt buộc'),
  description: z.string().optional(),
  level: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
})

type RoleFormData = z.infer<typeof roleSchema>

interface RoleFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: RoleFormData) => Promise<void>
  initialData?: Partial<UserRole> | null
}

export function RoleFormModal({ isOpen, onClose, onSubmit, initialData }: RoleFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      description: '',
      level: 0,
      isActive: true,
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || '',
        description: initialData.description || '',
        level: initialData.level ?? 0,
        isActive: initialData.isActive ?? true,
      })
    } else {
      form.reset({ name: '', description: '', level: 0, isActive: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData])

  const handleSubmit = async (data: RoleFormData) => {
    setIsLoading(true)
    try {
      await onSubmit(data)
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[550px] overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
        {/* Premium Header */}
        <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-0">
          {/* Animated background shapes */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 h-40 w-40 translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
          </div>

          <div className="relative px-8 py-6">
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-xl border border-white/30 bg-white/20 p-2.5 backdrop-blur-lg">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <DialogTitle className="text-2xl font-bold text-white">
                {initialData ? '✏️ Chỉnh sửa vai trò' : '➕ Thêm vai trò mới'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm font-medium text-cyan-100">
              {initialData ? 'Cập nhật thông tin vai trò' : 'Tạo một vai trò mới cho hệ thống'}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Form Content */}
        <div className="space-y-6 bg-gradient-to-b from-gray-50 to-white px-8 py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
              {/* Tên vai trò */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-bold text-gray-800">
                      <Layers className="h-4 w-4 text-emerald-600" />
                      Tên vai trò *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="VD: Manager, Admin, Supervisor..."
                        {...field}
                        className="h-10 rounded-lg border-2 border-gray-200 text-base transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      />
                    </FormControl>
                    <FormMessage className="mt-1 text-xs text-red-600" />
                  </FormItem>
                )}
              />

              {/* Mô tả */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-bold text-gray-800">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      Mô tả vai trò
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Mô tả chi tiết về vai trò này..."
                        {...field}
                        className="h-10 rounded-lg border-2 border-gray-200 text-base transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </FormControl>
                    <FormMessage className="mt-1 text-xs text-red-600" />
                  </FormItem>
                )}
              />

              {/* Grid: Level + Status */}
              <div className="grid grid-cols-2 gap-4">
                {/* Level */}
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-bold text-gray-800">
                        <span className="text-lg">🔢</span>
                        Level
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          value={field.value !== undefined ? String(field.value) : ''}
                          onChange={(e) => {
                            const v = e.target.value
                            field.onChange(v === '' ? undefined : Number(v))
                          }}
                          className="h-10 rounded-lg border-2 border-gray-200 text-base transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                        />
                      </FormControl>
                      <FormMessage className="mt-1 text-xs text-red-600" />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-bold text-gray-800">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Trạng thái
                      </FormLabel>
                      <FormControl>
                        <select
                          className="h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-all focus:border-green-500 focus:ring-2 focus:ring-green-200"
                          value={String(field.value)}
                          onChange={(e) => field.onChange(e.target.value === 'true')}
                        >
                          <option value="true" className="bg-green-50">
                            ✓ Hoạt động
                          </option>
                          <option value="false" className="bg-red-50">
                            ✗ Ngừng hoạt động
                          </option>
                        </select>
                      </FormControl>
                      <FormMessage className="mt-1 text-xs text-red-600" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Info card */}
              <div className="rounded-lg border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-cyan-50 p-4">
                <p className="text-xs text-gray-700">
                  <span className="font-bold text-emerald-700">💡 Tip:</span> Mỗi vai trò có thể
                  quản lý các quyền hạn khác nhau dựa trên level.
                </p>
              </div>

              {/* Form Footer */}
              <DialogFooter className="mt-6 flex gap-3 border-t-2 border-gray-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="rounded-lg border-2 border-gray-300 px-6 font-medium transition-all hover:border-gray-400 hover:bg-gray-50"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="min-w-[120px] rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-6 font-bold text-white shadow-lg transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>{initialData ? '💾 Lưu thay đổi' : '➕ Tạo vai trò'}</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
