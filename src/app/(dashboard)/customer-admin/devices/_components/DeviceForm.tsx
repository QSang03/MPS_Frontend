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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { deviceSchema, type DeviceFormData } from '@/lib/validations/device.schema'
import { deviceService } from '@/lib/api/services/device.service'
import type { Device } from '@/types/models'
import { DeviceStatus } from '@/constants/status'

interface DeviceFormProps {
  initialData?: Device
  customerId: string
  mode: 'create' | 'edit'
  onSuccess?: () => void
}

export function DeviceForm({ initialData, customerId, mode, onSuccess }: DeviceFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      serialNumber: initialData?.serialNumber || '',
      model: initialData?.model || '',
      location: initialData?.location || '',
      customerId: initialData?.customerId || customerId,
      status: initialData?.status || DeviceStatus.ACTIVE,
    },
  })

  const createMutation = useMutation({
    mutationFn: deviceService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      toast.success('Tạo thiết bị thành công!')
      form.reset()
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/customer-admin/devices')
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Tạo thiết bị thất bại'
      toast.error(message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: DeviceFormData) => deviceService.update(initialData!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      toast.success('Cập nhật thiết bị thành công!')
      form.reset()
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/customer-admin/devices/${initialData!.id}`)
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Cập nhật thiết bị thất bại'
      toast.error(message)
    },
  })

  const onSubmit = (data: DeviceFormData) => {
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
          name="serialNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Số serial</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nhập số serial"
                  {...field}
                  disabled={isPending}
                  className="font-mono"
                />
              </FormControl>
              <FormDescription>Số serial duy nhất của thiết bị</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ví dụ: HP LaserJet Pro MFP M428fdn"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>Tên model của thiết bị</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vị trí</FormLabel>
              <FormControl>
                <Input placeholder="Ví dụ: Tầng 3, Phòng 301" {...field} disabled={isPending} />
              </FormControl>
              <FormDescription>Vị trí vật lý của thiết bị</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {mode === 'edit' && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trạng thái</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái thiết bị" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(DeviceStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === DeviceStatus.ACTIVE
                          ? 'Hoạt động'
                          : status === DeviceStatus.INACTIVE
                            ? 'Ngưng hoạt động'
                            : status === DeviceStatus.ERROR
                              ? 'Lỗi'
                              : status === DeviceStatus.MAINTENANCE
                                ? 'Bảo trì'
                                : status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Trạng thái hoạt động hiện tại của thiết bị</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Tạo thiết bị' : 'Cập nhật thiết bị'}
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
