'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { customerSchema, type CustomerFormData } from '@/lib/validations/customer.schema'
import { customerService } from '@/lib/api/services/customer.service'
import type { Customer } from '@/types/models'

interface CustomerFormProps {
  initialData?: Customer
  mode: 'create' | 'edit'
  onSuccess?: () => void
}

export function CustomerForm({ initialData, mode, onSuccess }: CustomerFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: initialData?.name || '',
      address: initialData?.address || '',
    },
  })

  const createMutation = useMutation({
    mutationFn: customerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Tạo khách hàng thành công!')
      router.push('/system-admin/customers')
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Tạo khách hàng thất bại'
      toast.error(message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: CustomerFormData) => customerService.update(initialData!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Cập nhật khách hàng thành công!')
      router.push(`/system-admin/customers/${initialData!.id}`)
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Cập nhật khách hàng thất bại'
      toast.error(message)
    },
  })

  const onSubmit = (data: CustomerFormData) => {
    if (mode === 'create') {
      createMutation.mutate(data)
    } else {
      updateMutation.mutate(data)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên khách hàng</FormLabel>
              <FormControl>
                <Input placeholder="Nhập tên khách hàng" {...field} disabled={isPending} />
              </FormControl>
              <FormDescription>Tên chính thức của tổ chức khách hàng</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Địa chỉ</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Nhập địa chỉ khách hàng"
                  rows={4}
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>Địa chỉ vật lý của khách hàng</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Tạo khách hàng' : 'Cập nhật khách hàng'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess || (() => router.back())}
            disabled={isPending}
          >
            Hủy
          </Button>
        </div>
      </form>
    </Form>
  )
}
