'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/components/providers/LocaleProvider'
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
  const { t } = useLocale()

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
      toast.success(t('user_service_request.create.success'))
      form.reset()
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/system/service-requests')
      }
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t('user_service_request.create.error')
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
                  <FormLabel>{t('requests.service.field.title')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('requests.service.placeholder.title')} {...field} />
                  </FormControl>
                  <FormDescription>{t('requests.service.description.title')}</FormDescription>
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
                    <FormLabel>{t('requests.service.field.device')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={createMutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('requests.service.placeholder.device')} />
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
                    <FormDescription>{t('requests.service.description.device')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('requests.service.field.priority')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={createMutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('requests.service.placeholder.priority')} />
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
                    <FormDescription>{t('requests.service.description.priority')}</FormDescription>
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
                  <FormLabel>{t('requests.service.field.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('requests.service.placeholder.description')}
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
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {createMutation.isPending
                  ? t('button.processing')
                  : t('dashboard.actions.send_request')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
