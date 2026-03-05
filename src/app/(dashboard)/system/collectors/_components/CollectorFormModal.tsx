'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import { collectorsClientService } from '@/lib/api/services/collectors-client.service'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import type { AgentType, Collector, CreateCollectorDto } from '@/types/models/collector'
import type { Customer } from '@/types/models/customer'
import type { Device } from '@/types/models/device'

const formSchema = z.object({
  customerId: z.string().min(1, 'Vui lòng chọn khách hàng'),
  customerName: z.string().min(1, 'Tên khách hàng không được để trống'),
  address: z.string().min(1, 'Địa chỉ không được để trống'),
  subnets: z.string().min(1, 'Subnets không được để trống'),
  community: z.string().min(1, 'Community không được để trống'),
  type: z.enum(['COLLECTOR', 'TUNNEL', 'HYBRID']),
  deviceIds: z.array(z.string()).min(1, 'Vui lòng chọn ít nhất 1 thiết bị'),
})

type FormValues = z.infer<typeof formSchema>

interface CollectorFormModalProps {
  trigger: React.ReactNode
  onSaved?: (collector: Collector | null) => void
}

export default function CollectorFormModal({ trigger, onSaved }: CollectorFormModalProps) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [devices, setDevices] = useState<Device[]>([])
  const [loadingDevices, setLoadingDevices] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: '',
      customerName: '',
      address: '',
      subnets: '',
      community: 'public',
      type: 'COLLECTOR',
      deviceIds: [],
    },
  })

  const selectedCustomerId = form.watch('customerId')

  useEffect(() => {
    if (!open || !selectedCustomerId) {
      setDevices([])
      form.setValue('deviceIds', [])
      return
    }

    setLoadingDevices(true)
    devicesClientService
      .getAll({ customerId: selectedCustomerId, limit: 100, page: 1 })
      .then((res) => {
        const customerDevices = res.data || []
        setDevices(customerDevices)
        form.setValue('deviceIds', [])
      })
      .catch((err) => {
        console.error('Failed to load devices by customer:', err)
        setDevices([])
        form.setValue('deviceIds', [])
        toast.error(t('collectors.load_devices_error'))
      })
      .finally(() => {
        setLoadingDevices(false)
      })
  }, [open, selectedCustomerId, form, t])

  useEffect(() => {
    if (open) {
      setLoadingCustomers(true)
      customersClientService
        .getAll({ limit: 100, sortBy: 'name', sortOrder: 'asc' })
        .then((res) => {
          setCustomers(res.data || [])
        })
        .catch((err) => {
          console.error('Failed to load customers:', err)
          toast.error(t('collectors.load_customers_error'))
        })
        .finally(() => {
          setLoadingCustomers(false)
        })
    }
  }, [open, t])

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId)
    if (customer) {
      form.setValue('customerId', customerId)
      form.setValue('customerName', customer.name)
      form.setValue('deviceIds', [])
      // Set first address if available
      if (customer.address && customer.address.length > 0 && customer.address[0]) {
        form.setValue('address', customer.address[0])
      }
    }
  }

  const onSubmit = async (values: FormValues) => {
    if (devices.length === 0) {
      toast.error(t('collectors.no_devices_for_customer'))
      return
    }

    setLoading(true)
    try {
      const payload: CreateCollectorDto = {
        customerId: values.customerId,
        customerName: values.customerName,
        address: values.address,
        subnets: values.subnets,
        community: values.community,
        type: values.type as AgentType,
        deviceIds: values.deviceIds,
      }
      const result = await collectorsClientService.create(payload)
      toast.success(t('collectors.create_success'))
      onSaved?.(result)
      setOpen(false)
      form.reset()
    } catch (error) {
      console.error('Error creating collector:', error)
      toast.error((error as Error).message || t('collectors.create_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('collectors.create_title')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('collectors.customer')}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={handleCustomerChange}
                    disabled={loadingCustomers}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('collectors.select_customer')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} {customer.code ? `(${customer.code})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('collectors.customer_name')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('collectors.customer_name_placeholder')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('collectors.address')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t('collectors.address_placeholder')}
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subnets"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('collectors.subnets')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="192.168.1.0/24,10.0.0.0/24" />
                  </FormControl>
                  <FormDescription>{t('collectors.subnets_description')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="community"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('collectors.community')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="public" />
                  </FormControl>
                  <FormDescription>{t('collectors.community_description')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('collectors.agent_type')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('collectors.select_agent_type')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="COLLECTOR">
                        {t('collectors.agent_type_collector')}
                      </SelectItem>
                      <SelectItem value="TUNNEL">{t('collectors.agent_type_tunnel')}</SelectItem>
                      <SelectItem value="HYBRID">{t('collectors.agent_type_hybrid')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>{t('collectors.agent_type_description')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deviceIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('collectors.devices')}</FormLabel>
                  <FormDescription>{t('collectors.select_devices')}</FormDescription>

                  {loadingDevices ? (
                    <div className="text-muted-foreground flex items-center gap-2 rounded border p-3 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('collectors.loading_devices')}
                    </div>
                  ) : selectedCustomerId ? (
                    devices.length > 0 ? (
                      <div className="max-h-52 space-y-2 overflow-y-auto rounded border p-3">
                        {devices.map((device) => {
                          const checked = field.value.includes(device.id)
                          return (
                            <label
                              key={device.id}
                              className="flex cursor-pointer items-start gap-2 rounded p-1 hover:bg-gray-50"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(nextChecked) => {
                                  if (nextChecked) {
                                    field.onChange([...field.value, device.id])
                                  } else {
                                    field.onChange(field.value.filter((id) => id !== device.id))
                                  }
                                }}
                              />
                              <div className="leading-tight">
                                <div className="text-sm font-medium">{device.serialNumber}</div>
                                <div className="text-muted-foreground text-xs">
                                  {device.deviceModel?.name || device.model || '-'}
                                </div>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-muted-foreground rounded border p-3 text-sm">
                        {t('collectors.no_devices_for_customer')}
                      </div>
                    )
                  ) : (
                    <div className="text-muted-foreground rounded border p-3 text-sm">
                      {t('collectors.select_customer_first')}
                    </div>
                  )}

                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={loading || loadingDevices || devices.length === 0}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('collectors.start_build')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
