'use client'

import { useState, useEffect, type ReactNode } from 'react'
import Image from 'next/image'
import { useWatch } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Loader2,
  FileText,
  Monitor,
  Flag,
  AlertCircle,
  Image as ImageIcon,
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
import { useLocale } from '@/components/providers/LocaleProvider'

interface ServiceRequestFormModalProps {
  customerId: string
  onSuccess?: () => void
  children?: ReactNode
  preselectedDeviceId?: string
}

// priorityConfig sẽ được tạo trong component để có thể sử dụng t()

/**
 * Service Request Form in a modal dialog for user
 */
export function ServiceRequestFormModal({
  customerId,
  onSuccess,
  children,
  preselectedDeviceId,
}: ServiceRequestFormModalProps) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'SERVICE' | 'PURCHASE'>('SERVICE')
  const queryClient = useQueryClient()

  const priorityConfig = {
    [Priority.LOW]: {
      label: t('priority.low'),
      icon: '▼',
      color: 'text-slate-600 dark:text-slate-400',
      bgColor: 'bg-slate-100 dark:bg-slate-700',
      description: t('priority.low.description'),
    },
    [Priority.NORMAL]: {
      label: t('priority.normal'),
      icon: '→',
      color: 'text-[var(--brand-600)] dark:text-[var(--brand-400)]',
      bgColor: 'bg-[var(--brand-50)] dark:bg-[var(--brand-900)]/30',
      description: t('priority.normal.description'),
    },
    [Priority.HIGH]: {
      label: t('priority.high'),
      icon: '▲',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      description: t('priority.high.description'),
    },
    [Priority.URGENT]: {
      label: t('priority.urgent'),
      icon: '🔴',
      color: 'text-[var(--color-error-500)] dark:text-[var(--color-error-500)]',
      bgColor: 'bg-[var(--color-error-50)] dark:bg-[var(--color-error-600)]/30',
      description: t('priority.urgent.description'),
    },
  }
  const [purchaseItems, setPurchaseItems] = useState<
    Array<{ consumableTypeId: string; quantity: number; name?: string }>
  >([])
  const [images, setImages] = useState<File[]>([])
  const MAX_IMAGES = 10
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
  }, [preselectedDeviceId, open, form, customerId])

  const createServiceMutation = useMutation({
    mutationFn: serviceRequestsClientService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests', customerId] })
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      toast.success(t('user_service_request.create.success'), {
        description: t('user_service_request.create.success_description'),
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
      const message =
        error instanceof Error ? error.message : t('user_service_request.create.error')
      toast.error(message, {
        description: t('common.try_again_later'),
        icon: <AlertCircle className="h-5 w-5 text-black dark:text-white" />,
      })
    },
  })

  const createPurchaseMutation = useMutation({
    mutationFn: purchaseRequestsClientService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests', customerId] })
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
      toast.success(t('user_purchase_request.create.success'), {
        description: t('user_purchase_request.create.success_description'),
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
      const message =
        error instanceof Error ? error.message : t('user_purchase_request.create.error')
      toast.error(message, {
        description: t('common.try_again_later'),
        icon: <AlertCircle className="h-5 w-5 text-black dark:text-white" />,
      })
    },
  })

  const onSubmit = (data: ServiceRequestFormData) => {
    if (mode === 'SERVICE') {
      // Guard: If creating a SERVICE request and there are no active SLAs available, block
      if (!slasLoading && availableSlas.length === 0) {
        toast.error(t('user_service_request.no_sla'))
        return
      }
      // Guard: If the selected priority isn't mapped to an SLA, block
      if (!availablePriorities.includes(data.priority)) {
        toast.error(t('user_service_request.priority_no_sla'))
        return
      }

      const rest = data as unknown as AnyRecord
      const merged = { ...rest, customerId } as AnyRecord
      // Keep deviceId when provided by the user; strip status only
      if ('status' in merged) delete merged['status']
      const payload = removeEmpty(merged) as ServiceRequestFormData
      // If there are images selected, send multipart/form-data
      if (images && images.length > 0) {
        const form = new FormData()
        // append simple fields
        Object.entries(payload).forEach(([k, v]) => {
          if (v === undefined || v === null) return
          // for arrays/objects stringify
          if (typeof v === 'object') {
            try {
              form.append(k, JSON.stringify(v))
            } catch {
              // fallback
              form.append(k, String(v))
            }
          } else {
            form.append(k, String(v))
          }
        })

        // append images; backend expects multiple 'images' fields
        images.slice(0, MAX_IMAGES).forEach((file) => {
          form.append('images', file)
        })

        // debug
        console.debug(
          '[ServiceRequestFormModal] submitting FormData with images, keys:',
          Array.from(form.keys())
        )
        createServiceMutation.mutate(form)
      } else {
        // debug
        console.debug('[ServiceRequestFormModal] submitting payload:', payload)
        createServiceMutation.mutate(payload)
      }
      return
    }

    // PURCHASE mode
    if (!data.deviceId) {
      toast.error(t('user_purchase_request.select_device'))
      return
    }
    if (purchaseItems.length === 0) {
      toast.error(t('user_purchase_request.add_item'))
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
  const selectedDeviceId = useWatch({ control: form.control, name: 'deviceId' })
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

  // Only use active SLAs and derive available priorities
  const availableSlas = (slasData?.data || []).filter((s) => s.isActive)
  const availablePriorities = availableSlas.map((s) => s.priority)

  // Ensure form priority is set to a valid, available SLA priority when SLAs load
  useEffect(() => {
    if (mode !== 'SERVICE') return
    if (slasLoading) return
    if (!availablePriorities || availablePriorities.length === 0) return
    const currentPriority = form.getValues().priority
    if (!availablePriorities.includes(currentPriority)) {
      form.setValue('priority', availablePriorities[0] as Priority)
    }
  }, [slasLoading, slasData, mode, form, availablePriorities])

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
          <Button className="gap-2 bg-gradient-to-r from-[var(--brand-500)] to-[var(--brand-600)] text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-[var(--brand-600)] hover:to-[var(--brand-700)] hover:shadow-xl">
            <Plus className="h-5 w-5" />
            {t('user_service_request.create_new')}
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
                  <div className="rounded-2xl bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-600)] p-3 shadow-lg">
                    <FileText className="h-7 w-7 text-black dark:text-white" />
                  </div>
                  <div>
                    <DialogTitle className="bg-gradient-to-r from-[var(--brand-500)] via-[var(--brand-600)] to-[var(--brand-700)] bg-clip-text text-3xl font-bold text-transparent dark:from-[var(--brand-400)] dark:via-[var(--brand-500)] dark:to-[var(--brand-600)]">
                      {t('user_service_request.modal.title')}
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-base text-slate-600 dark:text-slate-400">
                      {t('user_service_request.modal.description')}
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
                            {t('table.device')}
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
                                      ? t('loading.devices')
                                      : t('user_service_request.select_device_placeholder')
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
                                      {t('common.loading')}
                                    </span>
                                  </div>
                                </SelectItem>
                              )}
                              {!devicesLoading && devicesData?.data.length === 0 && (
                                <SelectItem value="__empty" disabled>
                                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                    <AlertCircle className="h-4 w-4 text-black dark:text-white" />
                                    {t('empty.devices.empty')}
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
                            {t('user_service_request.select_device_hint')}
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
                          ? 'bg-white text-[var(--brand-600)] shadow dark:bg-slate-800 dark:text-[var(--brand-400)]'
                          : 'text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white'
                      }`}
                    >
                      {t('user_service_request.mode.service')}
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
                      {t('user_service_request.mode.purchase')}
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
                            {t('user_service_request.title')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('user_service_request.title_placeholder')}
                              {...field}
                              disabled={createServiceMutation.isPending}
                              className="h-12 rounded-xl border-slate-300/50 bg-white/60 backdrop-blur-xl transition-all duration-300 hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600/50 dark:bg-slate-700/60 dark:hover:border-indigo-500 dark:focus:border-indigo-400"
                            />
                          </FormControl>
                          <FormDescription className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                            {t('user_service_request.title_hint')}
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
                            {t('user_service_request.description')}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('user_service_request.description_placeholder')}
                              rows={6}
                              {...field}
                              disabled={createServiceMutation.isPending}
                              className="resize-none rounded-xl border-slate-300/50 bg-white/60 backdrop-blur-xl transition-all duration-300 hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600/50 dark:bg-slate-700/60 dark:hover:border-indigo-500 dark:focus:border-indigo-400"
                            />
                          </FormControl>
                          <FormDescription className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                            {t('user_service_request.description_hint')}
                          </FormDescription>
                          <FormMessage className="mt-1 text-xs" />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  {/* Images upload (SERVICE mode only) */}
                  {mode === 'SERVICE' && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 }}
                    >
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                          <FileText className="h-4 w-4 text-black dark:text-white" />
                          {t('user_service_request.images.optional')}
                        </FormLabel>
                        <div className="mt-2 flex flex-col gap-2">
                          <label className="relative flex cursor-pointer items-center justify-between rounded-xl border-2 border-dashed border-slate-300/60 bg-white/60 p-3 hover:border-indigo-400 dark:border-slate-600/50 dark:bg-slate-700/60">
                            <div className="flex items-center gap-3">
                              <ImageIcon className="h-5 w-5 text-slate-500 dark:text-slate-300" />
                              <div className="text-sm text-slate-700 dark:text-slate-300">
                                {t('user_service_request.images.drag_drop')}
                                <div className="text-xs text-slate-400">
                                  {t('user_service_request.images.formats')}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-slate-500">
                              {t('user_service_request.images.multiple')}
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => {
                                const files = Array.from(e.target.files || [])
                                setImages((prev) => {
                                  const combined = [...prev, ...files]
                                  if (combined.length > MAX_IMAGES) {
                                    toast.error(
                                      t('user_service_request.images.max_error', {
                                        max: MAX_IMAGES,
                                      })
                                    )
                                    return combined.slice(0, MAX_IMAGES)
                                  }
                                  return combined
                                })
                                // reset input value so same file can be re-selected if removed
                                e.currentTarget.value = ''
                              }}
                              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                              disabled={createServiceMutation.isPending}
                            />
                          </label>

                          {images.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {images.map((file, idx) => (
                                <div
                                  key={`${file.name}-${idx}`}
                                  className="relative flex h-20 w-20 flex-col items-center overflow-hidden rounded-lg border bg-white/60 p-1 text-xs shadow-sm dark:bg-slate-700/60"
                                >
                                  <Image
                                    src={URL.createObjectURL(file)}
                                    alt={file.name || ''}
                                    width={80}
                                    height={80}
                                    unoptimized
                                    className="h-full w-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setImages((prev) => prev.filter((_, i) => i !== idx))
                                    }
                                    className="absolute top-0 right-0 rounded-bl bg-red-600/90 px-1 py-0.5 text-[10px] text-white"
                                  >
                                    {t('common.delete')}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <FormDescription className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                          {t('user_service_request.images.description')}
                        </FormDescription>
                      </FormItem>
                    </motion.div>
                  )}

                  {/* Priority only in SERVICE mode */}
                  {mode === 'SERVICE' &&
                    (!slasLoading && availableSlas.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <div className="rounded-xl border border-dashed border-slate-200/60 px-3 py-3 text-sm text-slate-600 dark:border-slate-600/50 dark:text-slate-400">
                          {t('user_service_request.no_sla_message')}
                        </div>
                      </motion.div>
                    ) : (
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
                                {t('filters.priority_label')}
                              </FormLabel>
                              <div className="space-y-2">
                                {slasLoading ? (
                                  <div className="text-xs text-slate-500">
                                    {t('user_service_request.loading_slas')}
                                  </div>
                                ) : (
                                  availableSlas.map((sla) => (
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
                                )}
                              </div>
                              <FormDescription className="mt-1.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                <Sparkles className="h-3 w-3 text-black dark:text-white" />
                                {t('user_service_request.priority_hint')}
                              </FormDescription>
                              <FormMessage className="mt-1 text-xs" />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    ))}

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
                            {t('user_purchase_request.compatible_consumables')}
                          </h3>
                          <Input
                            placeholder={t('user_purchase_request.search_consumables')}
                            value={consumableSearch}
                            onChange={(e) => setConsumableSearch(e.target.value)}
                            className="h-8 w-40 rounded-lg border-slate-300/50 bg-white/70 text-xs dark:border-slate-600/50 dark:bg-slate-700/60"
                          />
                        </div>
                        <div className="max-h-56 overflow-y-auto rounded-md bg-slate-50 p-2 dark:bg-slate-800/40">
                          {compatibleLoading && (
                            <div className="flex items-center gap-2 p-2 text-xs text-slate-500 dark:text-slate-400">
                              <Loader2 className="h-4 w-4 animate-spin text-black dark:text-white" />
                              {t('user_purchase_request.loading_list')}
                            </div>
                          )}
                          {!compatibleLoading && filteredConsumables.length === 0 && (
                            <div className="p-2 text-xs text-slate-500 dark:text-slate-400">
                              {t('user_purchase_request.no_consumables')}
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
                                {t('common.add')}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200/60 p-4 dark:border-slate-600/50">
                        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {t('user_purchase_request.purchase_list')}
                        </h3>
                        {purchaseItems.length === 0 && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t('user_purchase_request.no_items')}
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
                                {t('common.delete')}
                              </button>
                            </div>
                          ))}
                        </div>
                        {purchaseItems.length > 0 && (
                          <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                            {t('user_purchase_request.total_items')}: {purchaseItems.length}
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
                      disabled={
                        createServiceMutation.isPending ||
                        createPurchaseMutation.isPending ||
                        // If creating SERVICE and SLAs are loaded but none are available, disable
                        (mode === 'SERVICE' && !slasLoading && availableSlas.length === 0)
                      }
                      className="h-12 flex-1 bg-[var(--btn-primary)] font-semibold text-[var(--btn-primary-foreground)] shadow-[var(--btn-primary)]/30 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-[var(--btn-primary-hover)] hover:shadow-xl"
                    >
                      {createServiceMutation.isPending || createPurchaseMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin text-black dark:text-white" />
                          {t('button.creating')}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-5 w-5 text-black dark:text-white" />
                          {mode === 'SERVICE'
                            ? t('user_service_request.create.submit')
                            : t('user_purchase_request.create.submit')}
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
                      {t('common.cancel')}
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
