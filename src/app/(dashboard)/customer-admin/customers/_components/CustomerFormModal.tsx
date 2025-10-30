/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import type { Customer } from '@/types/models/customer'

type LocalCustomerForm = Partial<Customer> & {
  code?: string
  contactEmail?: string
  contactPhone?: string
  contactPerson?: string
  tier?: string
  isActive?: boolean
  description?: string
}
import { Plus, Edit, Loader2, Building2, User, MapPin, CheckCircle2 } from 'lucide-react'

interface Props {
  mode?: 'create' | 'edit'
  customer?: Customer | null
  onSaved?: (c?: Customer | null) => void
}

export function CustomerFormModal({ mode = 'create', customer = null, onSaved }: Props) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<LocalCustomerForm>({
    name: '',
    code: '',
    contactEmail: '',
    contactPhone: '',
    contactPerson: '',
    address: '',
    tier: 'BASIC',
    isActive: true,
    description: '',
  })

  useEffect(() => {
    if (!customer) return
    const t = setTimeout(() => {
      setForm({
        name: customer.name,
        code: (customer as any).code,
        address: customer.address,
        description: (customer as any).description,
        contactEmail: (customer as any).contactEmail,
        contactPhone: (customer as any).contactPhone,
        contactPerson: (customer as any).contactPerson,
        tier: (customer as any).tier || 'BASIC',
        isActive: (customer as any).isActive ?? true,
      })
    }, 0)
    return () => clearTimeout(t)
  }, [customer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const payload = { ...form }
      if (mode === 'create') {
        const created = await customersClientService.create(payload as Partial<Customer>)
        toast.success('Tạo khách hàng thành công')
        setOpen(false)
        onSaved?.(created || null)
      } else if (customer) {
        const updated = await customersClientService.update(
          customer.id,
          payload as Partial<Customer>
        )
        toast.success('Cập nhật khách hàng thành công')
        setOpen(false)
        onSaved?.(updated || null)
      }
    } catch (err) {
      console.error('Customer save error', err)
      let userMessage = 'Có lỗi khi lưu khách hàng'
      try {
        const e = err as Error
        const msg = e.message || ''
        const jsonStart = msg.indexOf('{')
        if (jsonStart !== -1) {
          const jsonStr = msg.slice(jsonStart)
          const parsed = JSON.parse(jsonStr)
          userMessage = parsed?.error || parsed?.message || userMessage
        } else if (msg) {
          userMessage = msg
        }
      } catch {}
      toast.error(userMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'create' ? (
          <Button className="gap-2 bg-white text-violet-600 hover:bg-white/90">
            <Plus className="h-4 w-4" />
            Thêm khách hàng
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-[720px] overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
        <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-0">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 px-6 py-5">
            <div className="flex items-center gap-3">
              {mode === 'create' ? (
                <Building2 className="h-6 w-6 text-white" />
              ) : (
                <Edit className="h-6 w-6 text-white" />
              )}
              <DialogTitle className="text-2xl font-bold text-white">
                {mode === 'create' ? 'Tạo khách hàng mới' : 'Chỉnh sửa khách hàng'}
              </DialogTitle>
            </div>
            <DialogDescription className="mt-2 text-white/90">
              {mode === 'create' ? 'Thêm khách hàng vào hệ thống' : 'Cập nhật thông tin khách hàng'}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="bg-white">
          <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-violet-700">
                <User className="h-4 w-4" />
                Thông tin cơ bản
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Tên khách hàng *</Label>
                  <Input
                    value={form.name || ''}
                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Tên khách hàng"
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">Mã (code)</Label>
                  <Input
                    value={form.code || ''}
                    onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
                    placeholder="Mã khách hàng (ví dụ ABC_CORP)"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">Email liên hệ</Label>
                  <Input
                    value={form.contactEmail || ''}
                    onChange={(e) => setForm((s) => ({ ...s, contactEmail: e.target.value }))}
                    placeholder="contact@company.com"
                    className="h-11"
                    type="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">Số điện thoại</Label>
                  <Input
                    value={form.contactPhone || ''}
                    onChange={(e) => setForm((s) => ({ ...s, contactPhone: e.target.value }))}
                    placeholder="+84123456789"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">Người liên hệ</Label>
                  <Input
                    value={form.contactPerson || ''}
                    onChange={(e) => setForm((s) => ({ ...s, contactPerson: e.target.value }))}
                    placeholder="Tên người liên hệ"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">Cấp (Tier)</Label>
                  <Select
                    value={(form.tier as string) || 'BASIC'}
                    onValueChange={(v) => setForm((s) => ({ ...s, tier: v }))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Chọn tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BASIC">BASIC</SelectItem>
                      <SelectItem value="PREMIUM">PREMIUM</SelectItem>
                      <SelectItem value="ENTERPRISE">ENTERPRISE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-violet-700">
                <MapPin className="h-4 w-4" />
                Địa chỉ & mô tả
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Địa chỉ</Label>
                <Input
                  value={form.address || ''}
                  onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                  placeholder="Địa chỉ công ty"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Mô tả</Label>
                <Input
                  value={form.description || ''}
                  onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                  placeholder="Ghi chú thêm về khách hàng"
                  className="h-11"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-violet-700">
                <CheckCircle2 className="h-4 w-4" />
                Trạng thái
              </div>

              <div className="flex items-center justify-between rounded-lg border-2 p-4">
                <div>
                  <label className="flex items-center gap-2 text-base font-semibold">
                    Trạng thái hoạt động
                  </label>
                  <p className="text-muted-foreground text-sm">
                    Bật/tắt trạng thái hoạt động của khách hàng
                  </p>
                </div>
                <Switch
                  checked={!!form.isActive}
                  onCheckedChange={(v) => setForm((s) => ({ ...s, isActive: v }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t bg-gray-50 px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              type="button"
              disabled={submitting}
              className="min-w-[100px]"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="min-w-[140px] bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'create' ? 'Đang tạo...' : 'Đang lưu...'}
                </>
              ) : (
                <>
                  {mode === 'create' ? (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Tạo khách hàng
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Lưu thay đổi
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CustomerFormModal
