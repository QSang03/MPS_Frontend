'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Loader2,
  FileText,
  Monitor,
  Flag,
  AlertCircle,
  CheckCircle,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  serviceRequestSchema,
  type ServiceRequestFormData,
} from '@/lib/validations/service-request.schema'
import { serviceRequestsClientService } from '@/lib/api/services/service-requests-client.service'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import { Priority } from '@/constants/status'
import { removeEmpty } from '@/lib/utils/clean'

interface ServiceRequestFormModalProps {
  customerId: string
  onSuccess?: () => void
  children?: ReactNode
  preselectedDeviceId?: string
}

const priorityConfig = {
  [Priority.LOW]: {
    label: 'Thấp',
    icon: '▼',
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-700',
    description: 'Không khẩn cấp, có thể xử lý sau',
  },
  [Priority.NORMAL]: {
    label: 'Bình thường',
    icon: '→',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    description: 'Ưu tiên bình thường',
  },
  [Priority.HIGH]: {
    label: 'Cao',
    icon: '▲',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    description: 'Cần xử lý sớm',
  },
  [Priority.URGENT]: {
    label: 'Khẩn cấp',
    icon: '🔴',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    description: 'Cần xử lý ngay lập tức',
  },
}

/**
 * Service Request Form in a modal dialog for user
 */
export function ServiceRequestFormModal({
  customerId,
  onSuccess,
  children,
  preselectedDeviceId,
}: ServiceRequestFormModalProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  type AnyRecord = Record<string, unknown>

  // Fetch devices for dropdown
  const { data: devicesData, isLoading: devicesLoading } = useQuery({
    queryKey: ['devices', customerId],
    queryFn: () => devicesClientService.getAll({ page: 1, limit: 100, customerId }),
  })

  const form = useForm<ServiceRequestFormData>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      customerId,
      deviceId: preselectedDeviceId ?? '',
      title: '',
      description: '',
      priority: Priority.NORMAL,
    },
  })

  // When modal is opened with a preselected device, ensure the form value is set
  // (handles cases where devices data loads after initial render)
  useEffect(() => {
    if (preselectedDeviceId) {
      form.reset({ ...form.getValues(), deviceId: preselectedDeviceId, customerId })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedDeviceId, open])

  const createMutation = useMutation({
    mutationFn: serviceRequestsClientService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests', customerId] })
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      toast.success('Tạo yêu cầu bảo trì thành công!', {
        description: 'Yêu cầu của bạn đã được gửi đi',
        icon: <CheckCircle className="h-5 w-5 text-black dark:text-white" />,
      })
      form.reset({
        customerId,
        deviceId: '',
        title: '',
        description: '',
        priority: Priority.NORMAL,
      })
      setOpen(false)
      if (onSuccess) {
        onSuccess()
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Tạo yêu cầu bảo trì thất bại'
      toast.error(message, {
        description: 'Vui lòng thử lại sau',
        icon: <AlertCircle className="h-5 w-5 text-black dark:text-white" />,
      })
    },
  })

  const onSubmit = (data: ServiceRequestFormData) => {
    // Ensure we do NOT send `status` from the user modal (server should set default)
    const rest = data as unknown as AnyRecord
    const merged = { ...rest, customerId } as AnyRecord
    // Remove any status field if present
    if ('status' in merged) delete merged['status']
    const payload = removeEmpty(merged) as ServiceRequestFormData
    createMutation.mutate(payload)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-500/40">
            <Plus className="h-5 w-5" />
            Tạo yêu cầu mới
          </Button>
        </DialogTrigger>
      )}

      <AnimatePresence>
        {open && (
          <DialogContent className="max-h-[90vh] overflow-y-auto border-white/40 bg-gradient-to-br from-white/95 via-white/90 to-white/95 shadow-2xl backdrop-blur-2xl sm:max-w-2xl dark:border-slate-700/50 dark:from-slate-800/95 dark:via-slate-800/90 dark:to-slate-800/95">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <DialogHeader className="space-y-4 border-b border-slate-200/50 pb-6 dark:border-slate-700/50">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 p-3 shadow-lg shadow-blue-500/30">
                    <FileText className="h-7 w-7 text-black dark:text-white" />
                  </div>
                  <div>
                    <DialogTitle className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                      Tạo Yêu Cầu Mới
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-base text-slate-600 dark:text-slate-400">
                      Điền thông tin chi tiết cho yêu cầu bảo trì
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
                  {/* Device Selection */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <FormField
                      control={form.control}
                      name="deviceId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                            <Monitor className="h-4 w-4 text-black dark:text-white" />
                            Thiết bị
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={
                              createMutation.isPending || devicesLoading || !!preselectedDeviceId
                            }
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 justify-start rounded-xl border-slate-300/50 bg-white/60 pl-4 backdrop-blur-xl transition-all duration-300 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600/50 dark:bg-slate-700/60 dark:hover:border-indigo-500">
                                <SelectValue
                                  className="w-full text-left"
                                  placeholder={
                                    devicesLoading
                                      ? 'Đang tải thiết bị...'
                                      : 'Chọn thiết bị cần bảo trì'
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[300px] rounded-xl border-slate-200 bg-white/95 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/95">
                              {devicesLoading && (
                                <SelectItem value="__loading" disabled>
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-black dark:text-white" />
                                    <span className="text-slate-600 dark:text-slate-400">
                                      Đang tải...
                                    </span>
                                  </div>
                                </SelectItem>
                              )}
                              {!devicesLoading && devicesData?.data.length === 0 && (
                                <SelectItem value="__empty" disabled>
                                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                    <AlertCircle className="h-4 w-4 text-black dark:text-white" />
                                    Không có thiết bị nào
                                  </div>
                                </SelectItem>
                              )}
                              {devicesData?.data.map((device) => (
                                <SelectItem
                                  key={device.id}
                                  value={device.id}
                                  className="cursor-pointer transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                >
                                  <div className="flex items-center gap-2">
                                    <Monitor className="h-4 w-4 text-black dark:text-white" />
                                    <div className="flex flex-col">
                                      <span className="font-semibold text-slate-900 dark:text-white">
                                        {device.serialNumber}
                                      </span>
                                      <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {device.deviceModel?.name || device.model || 'N/A'} •{' '}
                                        {device.location || 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription className="mt-1.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <Sparkles className="h-3 w-3 text-black dark:text-white" />
                            Chọn thiết bị cần được bảo trì
                          </FormDescription>
                          <FormMessage className="mt-1 text-xs" />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  {/* Title */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                            <FileText className="h-4 w-4 text-black dark:text-white" />
                            Tiêu đề
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nhập tiêu đề ngắn gọn cho yêu cầu..."
                              {...field}
                              disabled={createMutation.isPending}
                              className="h-12 rounded-xl border-slate-300/50 bg-white/60 backdrop-blur-xl transition-all duration-300 hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600/50 dark:bg-slate-700/60 dark:hover:border-indigo-500 dark:focus:border-indigo-400"
                            />
                          </FormControl>
                          <FormDescription className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                            Tiêu đề ngắn gọn mô tả vấn đề
                          </FormDescription>
                          <FormMessage className="mt-1 text-xs" />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  {/* Description */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                            <FileText className="h-4 w-4 text-black dark:text-white" />
                            Mô tả chi tiết
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Mô tả chi tiết vấn đề, triệu chứng, thời điểm xảy ra..."
                              rows={6}
                              {...field}
                              disabled={createMutation.isPending}
                              className="resize-none rounded-xl border-slate-300/50 bg-white/60 backdrop-blur-xl transition-all duration-300 hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600/50 dark:bg-slate-700/60 dark:hover:border-indigo-500 dark:focus:border-indigo-400"
                            />
                          </FormControl>
                          <FormDescription className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                            Cung cấp thông tin chi tiết để được hỗ trợ tốt hơn
                          </FormDescription>
                          <FormMessage className="mt-1 text-xs" />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  {/* Priority */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                            <Flag className="h-4 w-4 text-black dark:text-white" />
                            Độ ưu tiên
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={createMutation.isPending}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-xl border-slate-300/50 bg-white/60 backdrop-blur-xl transition-all duration-300 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600/50 dark:bg-slate-700/60 dark:hover:border-indigo-500">
                                <SelectValue placeholder="Chọn mức độ ưu tiên" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl border-slate-200 bg-white/95 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/95">
                              {Object.entries(priorityConfig).map(([key, config]) => (
                                <SelectItem
                                  key={key}
                                  value={key}
                                  className="cursor-pointer transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg">{config.icon}</span>
                                    <div className="flex flex-col">
                                      <span className={`font-semibold ${config.color}`}>
                                        {config.label}
                                      </span>
                                      <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {config.description}
                                      </span>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription className="mt-1.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <Sparkles className="h-3 w-3 text-black dark:text-white" />
                            Đặt mức độ khẩn cấp của yêu cầu
                          </FormDescription>
                          <FormMessage className="mt-1 text-xs" />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex gap-3 border-t border-slate-200/50 pt-6 dark:border-slate-700/50"
                  >
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="h-12 flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-500/40"
                    >
                      {createMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin text-black dark:text-white" />
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-5 w-5 text-black dark:text-white" />
                          Tạo Yêu Cầu
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                      disabled={createMutation.isPending}
                      className="h-12 flex-1 border-slate-300/50 bg-white/60 font-semibold backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-white/80 dark:border-slate-600/50 dark:bg-slate-700/60 dark:hover:bg-slate-700/80"
                    >
                      Hủy
                    </Button>
                  </motion.div>
                </form>
              </Form>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
