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
    <div className="bg-card text-card-foreground rounded-lg border shadow-sm">
      <div className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Hidden Customer ID */}
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => <input type="hidden" {...field} />}
            />

            {/* Row 1: Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề</FormLabel>
                  <FormControl>
                    <Input placeholder="Tóm tắt vấn đề ngắn gọn..." {...field} />
                  </FormControl>
                  <FormDescription>Tiêu đề tóm tắt vấn đề (ít nhất 3 ký tự)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Row 2: Device & Priority (2 columns grid) */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                            {device.serialNumber} - {device.deviceModel?.name ?? device.model} (
                            {device.location})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Chọn thiết bị cần bảo trì (nếu có)</FormDescription>
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
                          <SelectValue placeholder="Chọn mức độ" />
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
                    <FormDescription>Mức độ khẩn cấp của yêu cầu</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3: Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả chi tiết</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả chi tiết vấn đề gặp phải, tình trạng hiện tại..."
                      rows={5}
                      className="resize-none"
                      {...field}
                      disabled={createMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-4 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onSuccess}
                disabled={createMutation.isPending}
              >
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {createMutation.isPending ? 'Đang xử lý...' : 'Gửi yêu cầu'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
