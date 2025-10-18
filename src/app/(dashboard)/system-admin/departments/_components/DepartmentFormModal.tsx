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
import { Loader2, Building2 } from 'lucide-react'
import type { Department } from '@/types/users'

const deptSchema = z.object({
  name: z.string().min(1, 'Tên bộ phận là bắt buộc'),
  code: z.string().min(1, 'Mã là bắt buộc'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

type DepartmentFormData = z.infer<typeof deptSchema>

interface DepartmentFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: DepartmentFormData) => Promise<void>
  initialData?: Partial<Department> | null
}

export function DepartmentFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: DepartmentFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(deptSchema),
    defaultValues: { name: '', code: '', description: '', isActive: true },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || '',
        code: initialData.code || '',
        description: initialData.description || '',
        isActive: initialData.isActive ?? true,
      })
    } else {
      form.reset({ name: '', code: '', description: '', isActive: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData])

  const handleSubmit = async (data: DepartmentFormData) => {
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {initialData ? 'Chỉnh sửa bộ phận' : 'Thêm bộ phận'}
          </DialogTitle>
          <DialogDescription>
            {initialData ? 'Cập nhật bộ phận' : 'Tạo bộ phận mới'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên bộ phận</FormLabel>
                  <FormControl>
                    <Input placeholder="Tên bộ phận" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mã</FormLabel>
                  <FormControl>
                    <Input placeholder="Mã bộ phận" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Input placeholder="Mô tả" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trạng thái</FormLabel>
                  <FormControl>
                    <select
                      className="input w-full rounded-md border px-3 py-2"
                      value={String(field.value)}
                      onChange={(e) => field.onChange(e.target.value === 'true')}
                    >
                      <option value="true">Hoạt động</option>
                      <option value="false">Ngừng hoạt động</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? 'Lưu' : 'Tạo'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
