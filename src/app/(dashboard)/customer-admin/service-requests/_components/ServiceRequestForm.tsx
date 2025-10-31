'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  serviceRequestSchema,
  type ServiceRequestFormData,
} from '@/lib/validations/service-request.schema'
import { serviceRequestService } from '@/lib/api/services/service-request.service'
import { deviceService } from '@/lib/api/services/device.service'
import { Priority } from '@/constants/status'
import { removeEmpty } from '@/lib/utils/clean'

interface ServiceRequestFormProps {
  customerId: string
  onSuccess?: () => void
}

export function ServiceRequestForm({ customerId, onSuccess }: ServiceRequestFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Fetch devices for dropdown
  const { data: devicesData } = useQuery({
    queryKey: ['devices', customerId],
    queryFn: () => deviceService.getAll({ page: 1, limit: 100, customerId }),
  })

  const form = useForm<ServiceRequestFormData>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      deviceId: '',
      description: '',
      priority: Priority.NORMAL,
    },
  })

  const createMutation = useMutation({
    mutationFn: serviceRequestService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      toast.success('Tạo yêu cầu bảo trì thành công!')
      form.reset()
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/customer-admin/service-requests')
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Tạo yêu cầu bảo trì thất bại'
      toast.error(message)
    },
  })

  const onSubmit = (data: ServiceRequestFormData) => {
    const payload = removeEmpty(data) as ServiceRequestFormData
    createMutation.mutate(payload)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="deviceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thiết bị</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={createMutation.isPending}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn thiết bị" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {devicesData?.items.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.serialNumber} - {device.model} ({device.location})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Chọn thiết bị cần bảo trì</FormDescription>
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
                <Textarea
                  placeholder="Mô tả chi tiết vấn đề gặp phải..."
                  rows={6}
                  {...field}
                  disabled={createMutation.isPending}
                />
              </FormControl>
              <FormDescription>Mô tả chi tiết vấn đề cần được xử lý</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Độ ưu tiên</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={createMutation.isPending}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn độ ưu tiên" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(Priority).map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority === Priority.LOW
                        ? 'Thấp'
                        : priority === Priority.NORMAL
                          ? 'Bình thường'
                          : priority === Priority.HIGH
                            ? 'Cao'
                            : priority === Priority.URGENT
                              ? 'Khẩn cấp'
                              : priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Đặt mức độ khẩn cấp của yêu cầu này</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {createMutation.isPending ? 'Đang tạo...' : 'Tạo yêu cầu'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            disabled={createMutation.isPending}
          >
            Hủy
          </Button>
        </div>
      </form>
    </Form>
  )
}
