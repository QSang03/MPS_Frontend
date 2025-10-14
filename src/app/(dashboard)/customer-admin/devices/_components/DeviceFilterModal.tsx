'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { X, Filter, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
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
import { Badge } from '@/components/ui/badge'
import { DeviceStatus } from '@/constants/status'

export interface DeviceFilterData {
  status?: DeviceStatus
  location?: string
  model?: string
  serialNumber?: string
  dateFrom?: string
  dateTo?: string
}

interface DeviceFilterModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: DeviceFilterData) => void
  initialFilters?: DeviceFilterData
}

const statusOptions = [
  { value: DeviceStatus.ACTIVE, label: 'Hoạt động' },
  { value: DeviceStatus.INACTIVE, label: 'Ngưng hoạt động' },
  { value: DeviceStatus.ERROR, label: 'Lỗi' },
  { value: DeviceStatus.MAINTENANCE, label: 'Bảo trì' },
]

export function DeviceFilterModal({
  isOpen,
  onClose,
  onApply,
  initialFilters = {},
}: DeviceFilterModalProps) {
  const [activeFilters, setActiveFilters] = useState<DeviceFilterData>(initialFilters)

  const form = useForm<DeviceFilterData>({
    defaultValues: initialFilters,
  })

  const handleApply = (data: DeviceFilterData) => {
    setActiveFilters(data)
    onApply(data)
    onClose()
  }

  const handleReset = () => {
    const emptyFilters: DeviceFilterData = {}
    form.reset(emptyFilters)
    setActiveFilters(emptyFilters)
    onApply(emptyFilters)
    onClose()
  }

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).filter((value) => value !== undefined && value !== '')
      .length
  }

  const removeFilter = (key: keyof DeviceFilterData) => {
    const newFilters = { ...activeFilters, [key]: undefined }
    setActiveFilters(newFilters)
    form.setValue(key, undefined)
    onApply(newFilters)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ lọc thiết bị
          </DialogTitle>
          <DialogDescription>
            Sử dụng các bộ lọc để tìm kiếm thiết bị theo tiêu chí cụ thể
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleApply)} className="space-y-6">
            {/* Active Filters */}
            {getActiveFilterCount() > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Bộ lọc đang áp dụng:</p>
                <div className="flex flex-wrap gap-2">
                  {activeFilters.status && (
                    <Badge variant="secondary" className="gap-1">
                      Trạng thái:{' '}
                      {statusOptions.find((opt) => opt.value === activeFilters.status)?.label}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeFilter('status')}
                      />
                    </Badge>
                  )}
                  {activeFilters.location && (
                    <Badge variant="secondary" className="gap-1">
                      Vị trí: {activeFilters.location}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeFilter('location')}
                      />
                    </Badge>
                  )}
                  {activeFilters.model && (
                    <Badge variant="secondary" className="gap-1">
                      Model: {activeFilters.model}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('model')} />
                    </Badge>
                  )}
                  {activeFilters.serialNumber && (
                    <Badge variant="secondary" className="gap-1">
                      Serial: {activeFilters.serialNumber}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeFilter('serialNumber')}
                      />
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Filter Fields */}
            <div className="grid grid-cols-1 gap-4">
              {/* Status Filter */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trạng thái</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location Filter */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vị trí</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập vị trí (ví dụ: Tầng 1, Phòng IT)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Model Filter */}
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập model thiết bị" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Serial Number Filter */}
              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số serial</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập số serial" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date Range Filters */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Từ ngày</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Đến ngày</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between gap-3">
              <Button type="button" variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Đặt lại
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Hủy
                </Button>
                <Button type="submit" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Áp dụng bộ lọc
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
