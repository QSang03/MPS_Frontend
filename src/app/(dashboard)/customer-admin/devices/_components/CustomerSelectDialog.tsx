'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Search, Building2, CheckCircle2, MapPin } from 'lucide-react'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import type { Customer } from '@/types/models/customer'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerLocation, setCustomerLocation] = useState('')

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

  useEffect(() => {
    if (error) {
      console.error('Failed to fetch customers', error)
      toast.error('Không thể tải danh sách khách hàng')
    }
  }, [error])

  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase()
    return (
      !term ||
      c.name?.toLowerCase().includes(term) ||
      c.code?.toLowerCase().includes(term) ||
      c.address?.toLowerCase().includes(term)
    )
  })

  const handleConfirm = () => {
    if (!selectedCustomer) return

    // Validate customerLocation if required (not warehouse)
    if (requiresLocation && !customerLocation.trim()) {
      toast.error('Vui lòng nhập vị trí tại khách hàng')
      return
    }

    onSelect(selectedCustomer, customerLocation.trim() || undefined)
    onOpenChange(false)
    setSelectedCustomer(null)
    setSearchTerm('')
    setCustomerLocation('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
        <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 p-0">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 px-6 py-5">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-white" />
              <DialogTitle className="text-2xl font-bold text-white">Chọn khách hàng</DialogTitle>
            </div>
            <DialogDescription className="mt-2 text-white/90">
              Chọn khách hàng cho thiết bị này
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 bg-white px-6 py-6">
          {/* Search */}
          <div>
            <Label className="text-base font-semibold">Tìm kiếm</Label>
            <div className="relative mt-2">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Tìm theo tên, mã khách hàng..."
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
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-muted-foreground p-8 text-center">
                <Building2 className="mx-auto mb-3 h-12 w-12 opacity-20" />
                <p>Không tìm thấy khách hàng</p>
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
                      'w-full rounded-lg border p-4 text-left transition-all hover:border-blue-500 hover:bg-blue-50',
                      isSelected && 'border-blue-500 bg-blue-50 ring-2 ring-blue-500',
                      isCurrent && 'border-green-500 bg-green-50'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-rose-600" />
                          <span className="font-semibold">{customer.name}</span>
                          {isCurrent && (
                            <span className="rounded bg-green-500 px-2 py-0.5 text-xs text-white">
                              Hiện tại
                            </span>
                          )}
                        </div>
                        <div className="text-muted-foreground mt-1 flex items-center gap-3 text-sm">
                          <span>Mã: {customer.code || '—'}</span>
                        </div>
                        {customer.address && (
                          <div className="text-muted-foreground mt-1 text-sm">
                            {customer.address}
                          </div>
                        )}
                      </div>
                      {isSelected && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Customer Location Input - Show when customer is not warehouse */}
          {requiresLocation && (
            <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
              <Label className="flex items-center gap-2 text-base font-semibold text-blue-900">
                <MapPin className="h-4 w-4 text-blue-600" />
                Vị trí tại khách hàng
                <span className="text-red-500">*</span>
              </Label>
              <Input
                value={customerLocation}
                onChange={(e) => setCustomerLocation(e.target.value)}
                placeholder="Nhập vị trí lắp đặt tại khách hàng..."
                className="h-11 border-blue-200 bg-white"
                autoFocus
              />
              <p className="text-xs text-blue-700">
                Nhập vị trí cụ thể của thiết bị tại khách hàng (phòng, tầng, khu vực...)
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t bg-gray-50 px-6 py-4">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              setSelectedCustomer(null)
              setSearchTerm('')
              setCustomerLocation('')
            }}
            className="min-w-[100px]"
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedCustomer || (!!requiresLocation && !customerLocation.trim())}
            className="min-w-[120px] bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
