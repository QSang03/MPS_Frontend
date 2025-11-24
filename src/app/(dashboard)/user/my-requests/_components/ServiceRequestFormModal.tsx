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
import { purchaseRequestsClientService } from '@/lib/api/services/purchase-requests-client.service'
import deviceModelsClientService from '@/lib/api/services/device-models-client.service'
import { Priority } from '@/constants/status'
import slasClientService from '@/lib/api/services/slas-client.service'
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
  const [mode, setMode] = useState<'SERVICE' | 'PURCHASE'>('SERVICE')
  const queryClient = useQueryClient()
  const [purchaseItems, setPurchaseItems] = useState<
    Array<{ consumableTypeId: string; quantity: number; name?: string }>
  >([])
  const [consumableSearch, setConsumableSearch] = useState('')

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

  const createServiceMutation = useMutation({
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

  const createPurchaseMutation = useMutation({
    mutationFn: purchaseRequestsClientService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests', customerId] })
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
      toast.success('Tạo yêu cầu mua hàng thành công!', {
        description: 'Yêu cầu mua đã được gửi đi',
        icon: <CheckCircle className="h-5 w-5 text-black dark:text-white" />,
      })
      setPurchaseItems([])
      form.reset({
        customerId,
        deviceId: '',
        title: '',
        description: '',
        priority: Priority.NORMAL,
      })
      setOpen(false)
      if (onSuccess) onSuccess()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Tạo yêu cầu mua hàng thất bại'
      toast.error(message, {
        description: 'Vui lòng thử lại sau',
        icon: <AlertCircle className="h-5 w-5 text-black dark:text-white" />,
      })
    },
  })

  const onSubmit = (data: ServiceRequestFormData) => {
    if (mode === 'SERVICE') {
      const rest = data as unknown as AnyRecord
      const merged = { ...rest, customerId } as AnyRecord
      // Do not send deviceId to the service request create API
      if ('deviceId' in merged) delete merged.deviceId
      if ('status' in merged) delete merged['status']
      const payload = removeEmpty(merged) as ServiceRequestFormData
      createServiceMutation.mutate(payload)
      return
    }

    // PURCHASE mode
    if (!data.deviceId) {
      toast.error('Vui lòng chọn thiết bị trước khi mua hàng')
      return
    }
    if (purchaseItems.length === 0) {
      toast.error('Thêm ít nhất một vật tư cần mua')
      return
    }
    createPurchaseMutation.mutate({
      customerId,
      title: data.title,
      description: data.description,
      items: purchaseItems.map(({ consumableTypeId, quantity }) => ({
        consumableTypeId,
        quantity,
      })),
    })
  }

  // Fetch compatible consumables when device changes & mode is PURCHASE
  const selectedDeviceId = form.watch('deviceId')
  const selectedDevice = devicesData?.data.find((d) => d.id === selectedDeviceId)
  const deviceModelId = selectedDevice?.deviceModel?.id
  const { data: compatibleConsumables, isLoading: compatibleLoading } = useQuery({
    queryKey: ['compatible-consumables', deviceModelId],
    queryFn: () =>
      deviceModelId ? deviceModelsClientService.getCompatibleConsumables(deviceModelId) : [],
    enabled: !!deviceModelId && mode === 'PURCHASE',
  })

  // Fetch SLAs for this customer to show detailed priority options in SERVICE mode
  const { data: slasData, isLoading: slasLoading } = useQuery({
    queryKey: ['slas', { customerId }],
    queryFn: () => slasClientService.getAll({ page: 1, limit: 100, customerId }),
    enabled: !!customerId && mode === 'SERVICE',
  })

  const filteredConsumables = (compatibleConsumables || []).filter((c) =>
    !consumableSearch ? true : (c.name || '').toLowerCase().includes(consumableSearch.toLowerCase())
  )

  const addPurchaseItem = (consumableTypeId: string, name?: string) => {
    setPurchaseItems((prev) => {
      if (prev.some((p) => p.consumableTypeId === consumableTypeId)) return prev
      return [...prev, { consumableTypeId, quantity: 1, name }]
    })
  }

  const updatePurchaseItemQuantity = (consumableTypeId: string, quantity: number) => {
    setPurchaseItems((prev) =>
      prev.map((p) => (p.consumableTypeId === consumableTypeId ? { ...p, quantity } : p))
    )
  }

  const removePurchaseItem = (consumableTypeId: string) => {
    setPurchaseItems((prev) => prev.filter((p) => p.consumableTypeId !== consumableTypeId))
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
                              createServiceMutation.isPending ||
                              createPurchaseMutation.isPending ||
                              devicesLoading ||
                              !!preselectedDeviceId
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
                            Chọn thiết bị cho yêu cầu
                          </FormDescription>
                          <FormMessage className="mt-1 text-xs" />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  {/* Mode Switch Tabs */}
                  <div className="mt-2 flex w-full items-center justify-start gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setMode('SERVICE')}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        mode === 'SERVICE'
                          ? 'bg-white text-blue-600 shadow dark:bg-slate-800 dark:text-blue-400'
                          : 'text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white'
                      }`}
                    >
                      Yêu cầu bảo trì
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('PURCHASE')}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        mode === 'PURCHASE'
                          ? 'bg-white text-indigo-600 shadow dark:bg-slate-800 dark:text-indigo-400'
                          : 'text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white'
                      }`}
                    >
                      Yêu cầu mua hàng
                    </button>
                  </div>

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
                              disabled={createServiceMutation.isPending}
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
                              disabled={createServiceMutation.isPending}
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

                  {/* Priority only in SERVICE mode */}
                  {mode === 'SERVICE' && (
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
                            <div className="space-y-2">
                              {slasLoading ? (
                                <div className="text-xs text-slate-500">Đang tải các SLA...</div>
                              ) : slasData?.data && slasData.data.length > 0 ? (
                                slasData.data.map((sla) => (
                                  <label
                                    key={sla.id}
                                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-900/20 ${field.value === sla.priority ? 'ring-2 ring-indigo-200 dark:ring-indigo-500' : ''}`}
                                  >
                                    <input
                                      type="radio"
                                      name="priority"
                                      value={sla.priority}
                                      checked={field.value === sla.priority}
                                      onChange={() => field.onChange(sla.priority)}
                                      disabled={createServiceMutation.isPending}
                                      className="h-4 w-4"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <span
                                          className={`font-semibold ${priorityConfig[sla.priority]?.color}`}
                                        >
                                          {sla.name}
                                        </span>
                                        <span className="text-[11px] text-slate-400">
                                          {sla.priority}
                                        </span>
                                      </div>
                                      <div className="truncate text-xs text-slate-500">
                                        {sla.description} • R: {sla.responseTimeHours}h • Res:{' '}
                                        {sla.resolutionTimeHours}h
                                      </div>
                                    </div>
                                  </label>
                                ))
                              ) : (
                                Object.entries(priorityConfig).map(([key, config]) => (
                                  <label
                                    key={key}
                                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-900/20 ${field.value === key ? 'ring-2 ring-indigo-200 dark:ring-indigo-500' : ''}`}
                                  >
                                    <input
                                      type="radio"
                                      name="priority"
                                      value={key}
                                      checked={field.value === key}
                                      onChange={() => field.onChange(key)}
                                      disabled={createServiceMutation.isPending}
                                      className="h-4 w-4"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <span className={`font-semibold ${config.color}`}>
                                          {config.label}
                                        </span>
                                        <span className="text-[11px] text-slate-400">{key}</span>
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        {config.description}
                                      </div>
                                    </div>
                                  </label>
                                ))
                              )}
                            </div>
                            <FormDescription className="mt-1.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                              <Sparkles className="h-3 w-3 text-black dark:text-white" />
                              Đặt mức độ khẩn cấp của yêu cầu
                            </FormDescription>
                            <FormMessage className="mt-1 text-xs" />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  )}

                  {/* Purchase Items Section */}
                  {mode === 'PURCHASE' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.35 }}
                      className="space-y-4"
                    >
                      <div className="rounded-xl border border-slate-200/60 p-4 dark:border-slate-600/50">
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Vật tư tương thích
                          </h3>
                          <Input
                            placeholder="Tìm kiếm vật tư..."
                            value={consumableSearch}
                            onChange={(e) => setConsumableSearch(e.target.value)}
                            className="h-8 w-40 rounded-lg border-slate-300/50 bg-white/70 text-xs dark:border-slate-600/50 dark:bg-slate-700/60"
                          />
                        </div>
                        <div className="max-h-56 overflow-y-auto rounded-md bg-slate-50 p-2 dark:bg-slate-800/40">
                          {compatibleLoading && (
                            <div className="flex items-center gap-2 p-2 text-xs text-slate-500 dark:text-slate-400">
                              <Loader2 className="h-4 w-4 animate-spin text-black dark:text-white" />
                              Đang tải danh sách...
                            </div>
                          )}
                          {!compatibleLoading && filteredConsumables.length === 0 && (
                            <div className="p-2 text-xs text-slate-500 dark:text-slate-400">
                              Không có vật tư phù hợp hoặc trống.
                            </div>
                          )}
                          {filteredConsumables.map((c) => (
                            <button
                              type="button"
                              key={c.id}
                              onClick={() => addPurchaseItem(c.id, c.name)}
                              className="group flex w-full items-center justify-between rounded-md p-2 text-left text-xs transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                            >
                              <span className="font-medium text-slate-700 dark:text-slate-200">
                                {c.name}
                              </span>
                              <span className="text-[10px] text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                Thêm
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200/60 p-4 dark:border-slate-600/50">
                        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Danh sách cần mua
                        </h3>
                        {purchaseItems.length === 0 && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Chưa có mục nào được thêm.
                          </p>
                        )}
                        <div className="space-y-2">
                          {purchaseItems.map((item) => (
                            <div
                              key={item.consumableTypeId}
                              className="flex items-center gap-3 rounded-lg bg-white/70 p-2 text-xs shadow-sm dark:bg-slate-700/60"
                            >
                              <span className="flex-1 font-medium text-slate-700 dark:text-slate-200">
                                {item.name || item.consumableTypeId}
                              </span>
                              <Input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) =>
                                  updatePurchaseItemQuantity(
                                    item.consumableTypeId,
                                    Math.max(1, Number(e.target.value) || 1)
                                  )
                                }
                                className="h-8 w-20 rounded-md border-slate-300/50 bg-white/90 px-2 text-right dark:border-slate-600/50 dark:bg-slate-800/60"
                              />
                              <button
                                type="button"
                                onClick={() => removePurchaseItem(item.consumableTypeId)}
                                className="rounded-md px-2 py-1 text-[10px] font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                              >
                                Xóa
                              </button>
                            </div>
                          ))}
                        </div>
                        {purchaseItems.length > 0 && (
                          <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                            Tổng mục: {purchaseItems.length}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex gap-3 border-t border-slate-200/50 pt-6 dark:border-slate-700/50"
                  >
                    <Button
                      type="submit"
                      disabled={createServiceMutation.isPending || createPurchaseMutation.isPending}
                      className="h-12 flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-500/40"
                    >
                      {createServiceMutation.isPending || createPurchaseMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin text-black dark:text-white" />
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-5 w-5 text-black dark:text-white" />
                          {mode === 'SERVICE' ? 'Tạo Yêu Cầu Bảo Trì' : 'Tạo Yêu Cầu Mua Hàng'}
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                      disabled={createServiceMutation.isPending || createPurchaseMutation.isPending}
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
