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
import { Input } from '@/components/ui/input'
import {
  serviceRequestSchema,
  type ServiceRequestFormData,
} from '@/lib/validations/service-request.schema'
import { serviceRequestsClientService } from '@/lib/api/services/service-requests-client.service'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
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
  // Use the client-safe devices client which calls Next.js API routes (/api/devices)
  // instead of calling the backend directly. This avoids CORS and uses the proxy.
  const { data: devicesData } = useQuery({
    queryKey: ['devices', customerId],
    queryFn: () => devicesClientService.getAll({ page: 1, limit: 100, customerId }),
  })

  const form = useForm<ServiceRequestFormData>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      deviceId: '',
      title: '',
      description: '',
      priority: Priority.NORMAL,
      customerId,
    },
  })

  const createMutation = useMutation({
    // Use client-safe API route so the browser calls /api/service-requests (Next.js proxy)
    mutationFn: serviceRequestsClientService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      toast.success('Tạo yêu cầu bảo trì thành công!')
      form.reset()
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/system/service-requests')
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
                  {devicesData?.data?.map((device) => (
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
        {/* Title (required by validation) */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tiêu đề</FormLabel>
              <FormControl>
                <Input placeholder="Tiêu đề ngắn gọn" {...field} />
              </FormControl>
              <FormDescription>Tiêu đề tóm tắt vấn đề (ít nhất 3 ký tự)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Hidden customerId so the form includes the prop value */}
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            // Hidden input — keep in form state so validation and payload include it
            <input type="hidden" {...field} />
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
