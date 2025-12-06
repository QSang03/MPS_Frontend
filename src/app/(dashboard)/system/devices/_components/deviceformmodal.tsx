'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Device, CreateDeviceDto, UpdateDeviceDto } from '@/types/models/device'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Loader2,
  Plus,
  Edit,
  Sparkles,
  Monitor,
  Hash,
  MapPin,
  Wifi,
  HardDrive,
  Settings,
  Package,
  CheckCircle2,
} from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
// removed Info import as it's unused
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import deviceModelsClientService from '@/lib/api/services/device-models-client.service'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import { removeEmpty } from '@/lib/utils/clean'
import {
  DEVICE_STATUS,
  STATUS_ALLOWED_FOR_ACTIVE,
  STATUS_ALLOWED_FOR_INACTIVE,
} from '@/constants/status'
import { Switch } from '@/components/ui/switch'
// removed unused Customer type import

interface Props {
  mode?: 'create' | 'edit'
  device?: Device | null
  onSaved?: (d?: Device) => void
  // When true, render compact icon-only trigger button (used in table action column)
  compact?: boolean
  trigger?: React.ReactNode
  // When provided, prefill create form with a customer id (used when creating from customer context)
  initialCustomerId?: string
  // When provided, prefill the isCustomerOwned flag for create mode
  initialIsCustomerOwned?: boolean
}

const buildInitialForm = () => ({
  deviceModelId: '',
  serialNumber: '',
  customerLocation: '',
  ipAddress: '',
  macAddress: '',
  firmware: '',
  isActive: true,
  isCustomerOwned: false,
  status: 'ACTIVE',
  inactiveReasonOption: '',
  inactiveReasonText: '',
  customerId: '',
})

export default function DeviceFormModal({
  mode = 'create',
  device = null,
  onSaved,
  compact = false,
  trigger,
  initialCustomerId,
  initialIsCustomerOwned,
}: Props) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showSerialWarning, setShowSerialWarning] = useState(false)
  const [customerAddresses, setCustomerAddresses] = useState<string[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  type DeviceFormState = ReturnType<typeof buildInitialForm>
  const [form, setForm] = useState<DeviceFormState>(() => buildInitialForm())
  const { t } = useLocale()
  // device models and customers are shared resources; use React Query to deduplicate
  const { data: modelsData, isLoading: modelsLoading } = useQuery({
    queryKey: ['device-models', { page: 1, limit: 100 }],
    queryFn: () => deviceModelsClientService.getAll({ page: 1, limit: 100 }).then((r) => r.data),
  })

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['customers', { page: 1, limit: 100 }],
    queryFn: () => customersClientService.getAll({ page: 1, limit: 100 }).then((r) => r.data),
  })

  const models = useMemo(() => modelsData ?? [], [modelsData])
  const customers = useMemo(() => customersData ?? [], [customersData])
  const hasPrefilledLocationRef = useRef(false)
  const lastInitializedKeyRef = useRef<string | null>(null)
  const lastFetchedCustomerIdRef = useRef<string | null>(null)

  const resolvedCustomerId = useMemo(() => {
    if (mode === 'edit') {
      return form.customerId || device?.customerId || ''
    }
    return form.customerId || ''
  }, [mode, form.customerId, device])

  const selectedCustomer = useMemo(() => {
    if (!resolvedCustomerId) return undefined
    return customers.find((c) => c.id === resolvedCustomerId)
  }, [customers, resolvedCustomerId])

  useEffect(() => {
    if (!open) {
      lastInitializedKeyRef.current = null
      setForm(buildInitialForm())
      setCustomerAddresses([])
      hasPrefilledLocationRef.current = false
      lastFetchedCustomerIdRef.current = null
      return
    }

    const key = mode === 'edit' ? `edit-${device?.id ?? 'none'}` : 'create'
    if (lastInitializedKeyRef.current === key) return
    lastInitializedKeyRef.current = key
    hasPrefilledLocationRef.current = false
    lastFetchedCustomerIdRef.current = null

    if (mode === 'edit' && device) {
      setForm({
        deviceModelId: device.deviceModelId || device.deviceModel?.id || '',
        serialNumber: device.serialNumber || '',
        customerLocation: device.location || device.customerLocation || '',
        ipAddress: device.ipAddress || '',
        macAddress: device.macAddress || '',
        firmware: device.firmware || '',
        isActive: typeof device.isActive === 'boolean' ? device.isActive : true,
        isCustomerOwned:
          typeof device.isCustomerOwned === 'boolean' ? device.isCustomerOwned : false,
        status:
          (device.status as string) ||
          (device.isActive ? DEVICE_STATUS.ACTIVE : DEVICE_STATUS.DECOMMISSIONED),
        inactiveReasonOption: device.inactiveReason ? device.inactiveReason : '',
        inactiveReasonText: device.inactiveReason || '',
        customerId: device.customerId || '',
      })
    } else {
      // Pre-fill create form when initial props provided (creating device under a customer)
      const base = buildInitialForm()
      if (typeof initialCustomerId === 'string' || typeof initialIsCustomerOwned === 'boolean') {
        setForm(() => ({
          ...base,
          ...(initialCustomerId ? { customerId: initialCustomerId } : {}),
          ...(typeof initialIsCustomerOwned === 'boolean'
            ? { isCustomerOwned: initialIsCustomerOwned }
            : {}),
        }))
      } else {
        setForm(base)
      }
    }
  }, [open, mode, device, initialCustomerId, initialIsCustomerOwned])

  // Fetch customer addresses when modal opens in edit mode and device has a customer
  useEffect(() => {
    if (!open || mode !== 'edit' || !device) {
      setCustomerAddresses([])
      hasPrefilledLocationRef.current = false
      lastFetchedCustomerIdRef.current = null
      return
    }

    if (!resolvedCustomerId) {
      setCustomerAddresses([])
      hasPrefilledLocationRef.current = false
      lastFetchedCustomerIdRef.current = null
      return
    }

    const isSystemWarehouse = selectedCustomer?.code === 'SYS'
    if (isSystemWarehouse) {
      setCustomerAddresses([])
      hasPrefilledLocationRef.current = false
      lastFetchedCustomerIdRef.current = null
      return
    }

    if (
      lastFetchedCustomerIdRef.current === resolvedCustomerId &&
      hasPrefilledLocationRef.current
    ) {
      return
    }
    lastFetchedCustomerIdRef.current = resolvedCustomerId

    const fetchCustomerDetails = async () => {
      setLoadingAddresses(true)
      try {
        const details = await customersClientService.getById(resolvedCustomerId)
        if (details?.address && Array.isArray(details.address)) {
          setCustomerAddresses(details.address)
          // Pre-select first address if no location is set (only once when addresses are loaded)
          if (
            details.address.length > 0 &&
            !form.customerLocation &&
            !hasPrefilledLocationRef.current
          ) {
            const firstAddr = details.address[0]
            if (firstAddr) {
              setForm((s: DeviceFormState) => ({ ...s, customerLocation: firstAddr }))
              hasPrefilledLocationRef.current = true
            }
          }
        } else {
          setCustomerAddresses([])
          hasPrefilledLocationRef.current = false
          lastFetchedCustomerIdRef.current = null
        }
      } catch (err) {
        console.error('Failed to fetch customer details', err)
        toast.error(t('error.load_customer_addresses'))
        setCustomerAddresses([])
        hasPrefilledLocationRef.current = false
        lastFetchedCustomerIdRef.current = null
      } finally {
        setLoadingAddresses(false)
      }
    }

    fetchCustomerDetails()
  }, [open, mode, device, resolvedCustomerId, selectedCustomer?.code, form.customerLocation, t])

  // previous explicit loaders replaced by React Query above

  const performSave = async () => {
    setSubmitting(true)
    try {
      if (!form.serialNumber) {
        toast.error(t('device.form.validation.serial_required'))
        setSubmitting(false)
        return
      }

      // Validate customerLocation when customer is not warehouse (SYS code) - Only in CREATE mode
      if (mode === 'create') {
        const selectedCustomer = customers.find((c) => c.id === form.customerId)
        const isSystemWarehouse = selectedCustomer?.code === 'SYS'
        if (selectedCustomer && !isSystemWarehouse && !form.customerLocation?.trim()) {
          toast.error(t('device.form.validation.location_required'))
          setSubmitting(false)
          return
        }
      }

      // Business rule: whenever isActive === false during edit, inactiveReason is required.
      const requiresReason = mode === 'edit' && form.isActive === false
      let chosenReason: string | undefined = undefined
      if (requiresReason) {
        if (form.inactiveReasonOption === '__other') {
          chosenReason = form.inactiveReasonText
        } else {
          chosenReason = form.inactiveReasonOption
        }
        if (!chosenReason || String(chosenReason).trim() === '') {
          toast.error(t('device.provide_inactive_reason'))
          setSubmitting(false)
          return
        }
      }

      // Validate status consistent with isActive (only during edit mode)
      if (mode === 'edit') {
        const activeStatuses = ['ACTIVE', 'MAINTENANCE', 'ERROR', 'OFFLINE']
        const inactiveStatuses = ['DECOMMISSIONED', 'SUSPENDED']
        const allowedStatuses = form.isActive ? activeStatuses : inactiveStatuses
        if (!allowedStatuses.includes(String(form.status))) {
          toast.error(t('device.invalid_status_for_is_active', { isActive: String(form.isActive) }))
          setSubmitting(false)
          return
        }
      }

      // Build payload
      let payload: Record<string, unknown> = {
        deviceModelId: form.deviceModelId || undefined,
        serialNumber: form.serialNumber,
        ipAddress: form.ipAddress || undefined,
        macAddress: form.macAddress || undefined,
        firmware: form.firmware || undefined,
        isCustomerOwned: form.isCustomerOwned,
      }

      // customerLocation and customerId: do NOT include them in the initial
      // create payload to avoid double-assignment behavior. Instead, create
      // the device first, then explicitly call assignToCustomer(deviceId, customerId)
      // and update the device location if needed. This guarantees the
      // `/devices/{id}/assign-to-customer` endpoint receives a payload of
      // the form { customerId } only.

      if (mode === 'edit') {
        payload.isActive = form.isActive
        payload.isCustomerOwned = form.isCustomerOwned
        // status must reflect the chosen status and follow backend enum (uppercase)
        payload.status = String(form.status).toUpperCase()
        payload.inactiveReason = chosenReason || undefined
      }
      // remove empty fields (trim whitespace-only strings, empty arrays/objects)
      payload = removeEmpty(payload) as typeof payload

      if (mode === 'create') {
        const created = await devicesClientService.create(payload as unknown as CreateDeviceDto)

        // If a customer was selected, explicitly assign the created device to
        // that customer using the assign endpoint (body: { customerId }).
        // Then update device.location with customerLocation if provided.
        try {
          if (form.customerId) {
            await devicesClientService.assignToCustomer(created.id, form.customerId)
          }

          if (form.customerLocation) {
            // update location after assignment
            await devicesClientService.update(created.id, { location: form.customerLocation })
          }
        } catch (assignErr) {
          // If assignment fails, surface an error but keep device created.
          console.error('Assign to customer after create failed', assignErr)
          // show user-friendly message
          toast.error(t('device.assign_after_create_failed'))
        }

        toast.success(t('device.create_success'))
        setOpen(false)
        onSaved?.(created)
      } else if (device && device.id) {
        const updated = await devicesClientService.update(
          device.id,
          payload as unknown as UpdateDeviceDto
        )
        // Update location if customerLocation is provided
        if (form.customerLocation) {
          try {
            await devicesClientService.update(device.id, { location: form.customerLocation })
          } catch (err) {
            console.error('Failed to update device location', err)
            // Don't fail the whole update if location update fails
          }
        }
        toast.success(t('device.update_success'))
        setOpen(false)
        onSaved?.(updated)
      }
    } catch (err: unknown) {
      console.error('Device save error', err)
      // Try to extract backend error message from Axios-like error
      const backendData = (
        err as { response?: { data?: { message?: string | string[]; error?: string | string[] } } }
      )?.response?.data
      const axiosError = err as { message?: string }
      let errorMessage = t('device.form.save_error')

      if (backendData?.message) {
        // Handle array of messages
        if (Array.isArray(backendData.message)) {
          errorMessage = backendData.message.join(', ')
        } else {
          errorMessage = String(backendData.message)
        }
      } else if (backendData?.error) {
        if (Array.isArray(backendData.error)) {
          errorMessage = backendData.error.join(', ')
        } else {
          errorMessage = String(backendData.error)
        }
      } else if (axiosError?.message) {
        errorMessage = axiosError.message
      }

      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // If creating and a serial is supplied, ask for confirmation because it cannot be edited later.
    if (mode === 'create' && form.serialNumber) {
      setShowSerialWarning(true)
      return
    }
    // For edit mode, do not allow changing serial if original exists
    if (mode === 'edit' && device?.serialNumber && form.serialNumber !== device.serialNumber) {
      toast.error(t('device.serial.locked'))
      return
    }
    await performSave()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : mode === 'create' ? (
        <DialogTrigger asChild>
          <Button className="gap-2 bg-white text-[var(--brand-500)] hover:bg-[var(--brand-50)]">
            <Plus className="h-4 w-4" />
            {t('devices.add')}
          </Button>
        </DialogTrigger>
      ) : compact ? (
        <Tooltip>
          <TooltipContent sideOffset={4}>{t('button.edit')}</TooltipContent>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-full p-0"
                  aria-label="Sửa"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </DialogTrigger>
          </TooltipTrigger>
        </Tooltip>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      )}

      <SystemModalLayout
        title={mode === 'create' ? t('device.create_title') : t('device.edit_title')}
        description={
          mode === 'create' ? t('device.create_description') : t('device.edit_description')
        }
        icon={mode === 'create' ? Sparkles : Edit}
        variant={mode}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
              className="min-w-[100px]"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              form="device-form"
              disabled={submitting}
              className="min-w-[120px] bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'create' ? t('button.creating') : t('button.saving')}
                </>
              ) : mode === 'create' ? (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('device.create_submit')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {t('device.save_changes')}
                </>
              )}
            </Button>
          </>
        }
      >
        <form id="device-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Device Model Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-700)]">
              <Package className="h-4 w-4" />
              {t('device.model_info')}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <Monitor className="h-4 w-4 text-[var(--brand-600)]" />
                {t('device.form.device_model')}
              </Label>
              <Select
                value={form.deviceModelId}
                onValueChange={(v) => setForm((s: DeviceFormState) => ({ ...s, deviceModelId: v }))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue
                    placeholder={
                      modelsLoading ? t('loading.models') : t('placeholder.select_model')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {modelsLoading && (
                    <SelectItem value="__loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('loading.loading')}
                      </div>
                    </SelectItem>
                  )}
                  {!modelsLoading && models.length === 0 && (
                    <SelectItem value="__empty" disabled>
                      {t('empty.models')}
                    </SelectItem>
                  )}
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.partNumber ? `${m.partNumber} — ${m.name}` : m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Customer Section - Only in CREATE mode */}
          {mode === 'create' && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-error-500)]">
                  <Package className="h-4 w-4" />
                  Thông tin Khách hàng
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <Package className="h-4 w-4 text-[var(--color-error-500)]" />
                    Khách hàng
                  </Label>
                  <Select
                    value={form.customerId}
                    onValueChange={(v) =>
                      setForm((s: DeviceFormState) => ({ ...s, customerId: v }))
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue
                        placeholder={
                          customersLoading
                            ? t('loading.customers')
                            : t('placeholder.select_customer')
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {customersLoading && (
                        <SelectItem value="__loading" disabled>
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang tải...
                          </div>
                        </SelectItem>
                      )}
                      {!customersLoading && customers.length === 0 && (
                        <SelectItem value="__empty" disabled>
                          {t('empty.customers')}
                        </SelectItem>
                      )}
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {t('device.assign_to_customer_instructions')}
                  </p>
                </div>

                {/* Customer Location - Only show when customer is NOT warehouse (SYS code) */}
                {(() => {
                  const selectedCustomer = customers.find((c) => c.id === form.customerId)
                  const isSystemWarehouse = selectedCustomer?.code === 'SYS'
                  const showField = form.customerId && !isSystemWarehouse

                  return showField ? (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-base font-semibold">
                        <MapPin className="h-4 w-4 text-rose-600" />
                        Vị trí tại khách hàng
                        <span className="text-red-500">*</span>
                      </Label>
                      {/* If customer has address as array, show a Select so user can pick an address.
                            If address is a string or missing, fall back to an Input. */}
                      {(() => {
                        const addr = selectedCustomer?.address
                        if (Array.isArray(addr) && addr.length > 0) {
                          return (
                            <Select
                              value={form.customerLocation}
                              onValueChange={(v) =>
                                setForm((s: DeviceFormState) => ({ ...s, customerLocation: v }))
                              }
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue
                                  placeholder={t('placeholder.select_customer_address')}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {addr.map((a: string, i: number) => (
                                  <SelectItem key={i} value={a}>
                                    {a}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )
                        }

                        // fallback to text input for single-string addresses or missing addresses
                        return (
                          <Input
                            value={form.customerLocation}
                            onChange={(e) =>
                              setForm((s: DeviceFormState) => ({
                                ...s,
                                customerLocation: e.target.value,
                              }))
                            }
                            placeholder={t('placeholder.customer_installation_location')}
                            className="h-11"
                            required
                          />
                        )
                      })()}

                      <p className="text-xs text-gray-500">
                        Chọn hoặc nhập vị trí cụ thể của thiết bị tại khách hàng (phòng, tầng, khu
                        vực...)
                      </p>
                    </div>
                  ) : null
                })()}
              </div>
              <Separator />
            </>
          )}

          {/* Basic Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-700">
              <Hash className="h-4 w-4" />
              Thông tin cơ bản
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <Hash className="h-4 w-4 text-cyan-600" />
                Serial Number *
              </Label>
              <Input
                value={form.serialNumber}
                onChange={(e) =>
                  setForm((s: DeviceFormState) => ({ ...s, serialNumber: e.target.value }))
                }
                placeholder="SN123456789"
                required
                className="h-11"
                disabled={mode === 'edit' && !!device?.serialNumber}
              />
              {mode === 'edit' && device?.serialNumber ? (
                <p className="text-muted-foreground mt-1 text-xs">{t('device.serial.locked')}</p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-1">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Settings className="h-4 w-4 text-indigo-600" />
                  Firmware
                </Label>
                <Input
                  value={form.firmware}
                  onChange={(e) =>
                    setForm((s: DeviceFormState) => ({ ...s, firmware: e.target.value }))
                  }
                  placeholder="v1.0.0"
                  className="h-11"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {t('device.is_customer_owned_label')}
                  </p>
                  <p className="text-xs text-slate-500">{t('device.is_customer_owned_desc')}</p>
                </div>
                <Switch
                  checked={!!form.isCustomerOwned}
                  onCheckedChange={(checked: boolean) =>
                    setForm((s: DeviceFormState) => ({ ...s, isCustomerOwned: checked }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Address field in edit mode - Show when device has a customer (not System warehouse) */}
          {mode === 'edit' &&
            (() => {
              const currentCustomerId = form.customerId || device?.customerId
              const selectedCustomer = customers.find((c) => c.id === currentCustomerId)
              const isSystemWarehouse = selectedCustomer?.code === 'SYS'
              const showAddressField =
                currentCustomerId &&
                !isSystemWarehouse &&
                (customerAddresses.length > 0 || loadingAddresses)

              return showAddressField ? (
                <div className="mt-4">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <MapPin className="h-4 w-4 text-rose-600" />
                    {t('device.address')}
                  </Label>
                  {loadingAddresses ? (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('loading.addresses')}
                    </div>
                  ) : customerAddresses.length > 0 ? (
                    <Select
                      value={form.customerLocation}
                      onValueChange={(v) =>
                        setForm((s: DeviceFormState) => ({ ...s, customerLocation: v }))
                      }
                    >
                      <SelectTrigger className="mt-2 h-11">
                        <SelectValue placeholder={t('placeholder.select_customer_address')} />
                      </SelectTrigger>
                      <SelectContent>
                        {customerAddresses.map((addr, i) => (
                          <SelectItem key={i} value={addr}>
                            {addr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={form.customerLocation}
                      onChange={(e) =>
                        setForm((s: DeviceFormState) => ({
                          ...s,
                          customerLocation: e.target.value,
                        }))
                      }
                      placeholder={t('placeholder.enter_address')}
                      className="mt-2 h-11"
                    />
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {customerAddresses.length > 0
                      ? t('device.choose_address_from_list')
                      : t('device.enter_customer_address')}
                  </p>
                </div>
              ) : null
            })()}

          {/* Active toggle & reason (only in edit mode) */}
          {mode === 'edit' && (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-base font-semibold text-gray-700">
                  <Package className="h-4 w-4 text-gray-600" />
                  Trạng thái hoạt động
                </div>
                <div>
                  <Switch
                    checked={!!form.isActive}
                    onCheckedChange={(v: boolean) =>
                      setForm((s: DeviceFormState) => {
                        const isActiveNew = !!v
                        // adjust status default when toggling
                        let newStatus = s.status
                        if (!isActiveNew) {
                          // switch to a safe inactive status if current is active-type
                          if (
                            STATUS_ALLOWED_FOR_ACTIVE.includes(
                              String(s.status) as import('@/constants/status').DeviceStatusValue
                            )
                          ) {
                            newStatus = DEVICE_STATUS.DECOMMISSIONED
                          }
                        } else {
                          // switching to active: if currently DECOMMISSIONED/SUSPENDED, set to ACTIVE
                          if (
                            STATUS_ALLOWED_FOR_INACTIVE.includes(
                              String(s.status) as import('@/constants/status').DeviceStatusValue
                            )
                          ) {
                            newStatus = DEVICE_STATUS.ACTIVE
                          }
                        }
                        return {
                          ...s,
                          isActive: isActiveNew,
                          status: newStatus,
                          // clear reasons when re-activating
                          inactiveReasonOption: isActiveNew ? '' : s.inactiveReasonOption,
                          inactiveReasonText: isActiveNew ? '' : s.inactiveReasonText,
                        }
                      })
                    }
                  />
                </div>
              </div>

              {/* Status selector */}
              <div className="mt-3">
                <Label className="text-sm font-medium">{t('device.form.status')}</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((s: DeviceFormState) => ({ ...s, status: v }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={t('device.form.status_placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {form.isActive ? (
                      <>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                        <SelectItem value="ERROR">Error</SelectItem>
                        <SelectItem value="OFFLINE">Offline</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="DECOMMISSIONED">Decommissioned</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Show reason selector when isActive is false */}
              {form.isActive === false && (
                <div className="mt-3 space-y-2">
                  <Label className="text-sm font-medium">{t('device.form.reason')}</Label>
                  <Select
                    value={form.inactiveReasonOption}
                    onValueChange={(v) =>
                      setForm((s: DeviceFormState) => ({ ...s, inactiveReasonOption: v }))
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t('device.form.reason_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tạm dừng do lỗi">
                        {t('device.form.reason.pause_error')}
                      </SelectItem>
                      <SelectItem value="Hủy HĐ">
                        {t('device.form.reason.cancel_contract')}
                      </SelectItem>
                      <SelectItem value="Hoàn tất HĐ">
                        {t('device.form.reason.complete_contract')}
                      </SelectItem>
                      <SelectItem value="__other">{t('device.form.reason.other')}</SelectItem>
                    </SelectContent>
                  </Select>

                  {form.inactiveReasonOption === '__other' && (
                    <Input
                      value={form.inactiveReasonText}
                      onChange={(e) =>
                        setForm((s: DeviceFormState) => ({
                          ...s,
                          inactiveReasonText: e.target.value,
                        }))
                      }
                      placeholder={t('device.form.reason.other_placeholder')}
                      className="h-11"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Network Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
              <Wifi className="h-4 w-4" />
              {t('device.form.network_info')}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Wifi className="h-4 w-4 text-[var(--brand-600)]" />
                  {t('device.ip')}
                </Label>
                <Input
                  value={form.ipAddress}
                  onChange={(e) =>
                    setForm((s: DeviceFormState) => ({ ...s, ipAddress: e.target.value }))
                  }
                  placeholder="192.168.1.100"
                  className="h-11 font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <HardDrive className="h-4 w-4 text-purple-600" />
                  {t('device.mac')}
                </Label>
                <Input
                  value={form.macAddress}
                  onChange={(e) =>
                    setForm((s: DeviceFormState) => ({ ...s, macAddress: e.target.value }))
                  }
                  placeholder="00:00:00:00:00:00"
                  className="h-11 font-mono"
                />
              </div>
            </div>
          </div>
        </form>
      </SystemModalLayout>
      {/* Serial confirmation modal (controlled) */}
      <AlertDialog open={showSerialWarning} onOpenChange={setShowSerialWarning}>
        <AlertDialogContent className="max-w-lg overflow-hidden rounded-lg border p-0 shadow-lg">
          <div className="px-6 py-5">
            <AlertDialogHeader className="space-y-2 text-left">
              <AlertDialogTitle className="text-lg font-bold">
                {t('device.serial.confirm_title')}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground text-sm">
                {t('device.serial.confirm_description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="bg-muted/50 border-t px-6 py-4">
            <AlertDialogCancel
              onClick={() => setShowSerialWarning(false)}
              className="min-w-[100px]"
            >
              {t('cancel')}
            </AlertDialogCancel>
            <Button
              onClick={async () => {
                setShowSerialWarning(false)
                await performSave()
              }}
              className="min-w-[120px] bg-amber-600"
            >
              {t('confirm.ok')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
