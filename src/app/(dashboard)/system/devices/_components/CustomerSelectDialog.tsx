'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Search, Building2, CheckCircle2, MapPin } from 'lucide-react'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { Customer } from '@/types/models/customer'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useLocale } from '@/components/providers/LocaleProvider'

interface CustomerSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (customer: Customer, customerLocation?: string) => void
  currentCustomerId?: string
}

export function CustomerSelectDialog({
  open,
  onOpenChange,
  onSelect,
  currentCustomerId,
}: CustomerSelectDialogProps) {
  const { t } = useLocale()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerLocation, setCustomerLocation] = useState('')
  const [customerAddresses, setCustomerAddresses] = useState<string[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)

  const query = useQuery({
    queryKey: ['customers', { page: 1, limit: 100 }],
    queryFn: () => customersClientService.getAll({ page: 1, limit: 100 }).then((r) => r.data),
    enabled: open,
  })

  const { data: customersData, isLoading: loading, error } = query

  // derive customers directly from the query result to avoid copying state inside an effect
  const customers = (customersData as Customer[] | undefined) ?? []

  // Check if selected customer is warehouse (SYS code)
  const isWarehouseCustomer = selectedCustomer?.code === 'SYS'
  const requiresLocation = selectedCustomer && !isWarehouseCustomer

  // Fetch full customer details when a customer is selected to get addresses
  useEffect(() => {
    if (!selectedCustomer || isWarehouseCustomer) {
      setCustomerAddresses([])
      setCustomerLocation('')
      return
    }

    const fetchCustomerDetails = async () => {
      setLoadingAddresses(true)
      try {
        const details = await customersClientService.getById(selectedCustomer.id)
        if (details?.address && Array.isArray(details.address)) {
          setCustomerAddresses(details.address)
          // Pre-select first address if available
          if (details.address.length > 0 && details.address[0]) {
            setCustomerLocation(details.address[0])
          }
        } else {
          setCustomerAddresses([])
          setCustomerLocation('')
        }
      } catch (err) {
        console.error('Failed to fetch customer details', err)
        toast.error(t('customer.select.error.load_addresses'))
        setCustomerAddresses([])
      } finally {
        setLoadingAddresses(false)
      }
    }

    fetchCustomerDetails()
  }, [selectedCustomer, isWarehouseCustomer, t])

  useEffect(() => {
    if (error) {
      console.error('Failed to fetch customers', error)
      toast.error(t('customer.select.error.load_list'))
    }
  }, [error, t])

  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase()
    return (
      !term ||
      c.name?.toLowerCase().includes(term) ||
      c.code?.toLowerCase().includes(term) ||
      (Array.isArray(c.address)
        ? c.address.some((a) =>
            String(a || '')
              .toLowerCase()
              .includes(term)
          )
        : false)
    )
  })

  const handleConfirm = () => {
    if (!selectedCustomer) return

    // Validate customerLocation if required (not warehouse)
    if (requiresLocation && !customerLocation.trim()) {
      toast.error(t('customer.select.error.location_required'))
      return
    }

    onSelect(selectedCustomer, customerLocation.trim() || undefined)
    onOpenChange(false)
    setSelectedCustomer(null)
    setSearchTerm('')
    setCustomerLocation('')
    setCustomerAddresses([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SystemModalLayout
        title={t('customer.select.title')}
        description={t('customer.select.description')}
        icon={Building2}
        variant="view"
        footer={
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false)
                    setSelectedCustomer(null)
                    setSearchTerm('')
                    setCustomerLocation('')
                  }}
                  className="min-w-[100px] cursor-pointer"
                >
                  {t('cancel')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('cancel')}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleConfirm}
                  disabled={!selectedCustomer || (!!requiresLocation && !customerLocation.trim())}
                  className="min-w-[120px] cursor-pointer bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {t('customer.select.confirm')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('customer.select.confirm')}</p>
              </TooltipContent>
            </Tooltip>
          </>
        }
      >
        {/* Search */}
        <div>
          <Label className="text-base font-semibold">{t('customer.select.search')}</Label>
          <div className="relative mt-2">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder={t('customer.select.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-9"
            />
          </div>
        </div>

        {/* Customer List */}
        <div className="max-h-[400px] space-y-2 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-600)]" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-muted-foreground p-8 text-center">
              <Building2 className="mx-auto mb-3 h-12 w-12 opacity-20" />
              <p>{t('customer.select.empty')}</p>
            </div>
          ) : (
            filteredCustomers.map((customer) => {
              const isSelected = selectedCustomer?.id === customer.id
              const isCurrent = currentCustomerId === customer.id

              return (
                <button
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={cn(
                    'w-full rounded-lg border p-4 text-left transition-all hover:border-[var(--brand-500)] hover:bg-[var(--brand-50)]',
                    isSelected &&
                      'border-[var(--brand-500)] bg-[var(--brand-50)] ring-2 ring-[var(--brand-500)]',
                    isCurrent && 'border-[var(--color-success-500)] bg-[var(--color-success-50)]'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-rose-600" />
                        <span className="font-semibold">{customer.name}</span>
                        {isCurrent && (
                          <span className="rounded bg-[var(--color-success-500)] px-2 py-0.5 text-xs text-white">
                            {t('customer.select.current')}
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground mt-1 flex items-center gap-3 text-sm">
                        <span>
                          {t('customer.select.code')}: {customer.code || '—'}
                        </span>
                      </div>
                      {customer.address && (
                        <div className="text-muted-foreground mt-1 text-sm">
                          {Array.isArray(customer.address)
                            ? customer.address[0] || '—'
                            : customer.address}
                        </div>
                      )}
                    </div>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-[var(--brand-600)]" />}
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Customer Location Input - Show when customer is not warehouse */}
        {requiresLocation && (
          <div className="space-y-2 rounded-lg border border-[var(--brand-200)] bg-[var(--brand-50)]/50 p-4">
            <Label className="flex items-center gap-2 text-base font-semibold text-[var(--brand-900)]">
              <MapPin className="h-4 w-4 text-[var(--brand-600)]" />
              {t('customer.select.location.label')}
              <span className="text-red-500">*</span>
            </Label>
            {loadingAddresses ? (
              <Select disabled>
                <SelectTrigger className="h-11 border-[var(--brand-200)] bg-white">
                  <SelectValue placeholder={t('customer.select.location.loading')} />
                </SelectTrigger>
              </Select>
            ) : customerAddresses.length > 0 ? (
              <Select value={customerLocation} onValueChange={setCustomerLocation}>
                <SelectTrigger className="h-11 border-[var(--brand-200)] bg-white">
                  <SelectValue placeholder={t('customer.select.location.select_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {customerAddresses.map((addr, idx) => (
                    <SelectItem key={idx} value={addr}>
                      {addr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={customerLocation}
                onChange={(e) => setCustomerLocation(e.target.value)}
                placeholder={t('customer.select.location.input_placeholder')}
                className="h-11 border-[var(--brand-200)] bg-white"
                autoFocus
              />
            )}
            <p className="text-xs text-[var(--brand-700)]">
              {customerAddresses.length > 0
                ? t('customer.select.location.hint.with_addresses')
                : t('customer.select.location.hint.no_addresses')}
            </p>
          </div>
        )}
      </SystemModalLayout>
    </Dialog>
  )
}
