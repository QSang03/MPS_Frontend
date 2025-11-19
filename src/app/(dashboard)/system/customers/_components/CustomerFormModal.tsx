/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState, useRef } from 'react'
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
import removeEmpty from '@/lib/utils/clean'
import type { Customer } from '@/types/models/customer'

type LocalCustomerForm = Partial<Customer> & {
  code?: string
  contactEmail?: string
  contactPhone?: string
  contactPerson?: string
  tier?: string
  isActive?: boolean
  description?: string
  billingDay?: number
}
import { Plus, Edit, Loader2, Building2, User, MapPin, CheckCircle2 } from 'lucide-react'

interface Props {
  mode?: 'create' | 'edit'
  customer?: Customer | null
  onSaved?: (c?: Customer | null) => void
  // optional custom trigger element (used to render an edit button inside the table)
  trigger?: React.ReactNode
}

export function CustomerFormModal({ mode = 'create', customer = null, onSaved, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<LocalCustomerForm>({
    name: '',
    code: '',
    contactEmail: '',
    contactPhone: '',
    contactPerson: '',
    address: [],
    tier: 'BASIC',
    isActive: true,
    description: '',
    billingDay: undefined,
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const clearFieldError = (key: string) =>
    setFieldErrors((prev) => {
      if (!prev || !prev[key]) return prev
      const copy = { ...prev }
      delete copy[key]
      return copy
    })
  // refs for inputs so we can autofocus the first invalid field
  const nameRef = useRef<HTMLInputElement | null>(null)
  const codeRef = useRef<HTMLInputElement | null>(null)
  const contactEmailRef = useRef<HTMLInputElement | null>(null)
  const contactPhoneRef = useRef<HTMLInputElement | null>(null)
  const contactPersonRef = useRef<HTMLInputElement | null>(null)
  const addressRef = useRef<HTMLInputElement | null>(null)
  const descriptionRef = useRef<HTMLInputElement | null>(null)
  const billingDayRef = useRef<HTMLInputElement | null>(null)

  // autofocus first invalid field when fieldErrors is set by server validation
  useEffect(() => {
    const keys = Object.keys(fieldErrors || {})
    if (!keys.length) return
    const order = [
      'name',
      'code',
      'contactEmail',
      'contactPhone',
      'contactPerson',
      'address',
      'description',
      'billingDay',
    ]

    const refs: Record<string, React.RefObject<HTMLInputElement | null>> = {
      name: nameRef,
      code: codeRef,
      contactEmail: contactEmailRef,
      contactPhone: contactPhoneRef,
      contactPerson: contactPersonRef,
      address: addressRef,
      description: descriptionRef,
      billingDay: billingDayRef,
    }

    for (const k of order) {
      const r = refs[k]
      if (fieldErrors[k] && r?.current) {
        // focus after paint
        setTimeout(() => {
          try {
            r.current?.focus()
            r.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          } catch {
            /* ignore */
          }
        }, 0)
        break
      }
    }
  }, [fieldErrors])

  useEffect(() => {
    if (!customer) return
    const t = setTimeout(() => {
      setForm({
        name: customer.name,
        code: (customer as any).code,
        // Normalize address to array
        address: Array.isArray((customer as any).address)
          ? (customer as any).address
          : typeof (customer as any).address === 'string' && (customer as any).address
            ? [(customer as any).address]
            : [],
        description: (customer as any).description,
        contactEmail: (customer as any).contactEmail,
        contactPhone: (customer as any).contactPhone,
        contactPerson: (customer as any).contactPerson,
        tier: (customer as any).tier || 'BASIC',
        isActive: (customer as any).isActive ?? true,
        billingDay: (customer as any).billingDay,
      })
    }, 0)
    return () => clearTimeout(t)
  }, [customer])

  // Client-side validation before submit
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    // name is required
    if (!form.name || String(form.name).trim().length === 0) {
      errors.name = 'Tên khách hàng là bắt buộc'
    }

    // if email provided, basic email format check
    if (form.contactEmail && String(form.contactEmail).trim().length > 0) {
      const email = String(form.contactEmail).trim()
      // stricter email check: require at least one dot in domain and TLD of letters (2-63)
      // allows subdomains like a.b.example.com
      const emailRe = /^[^\s@]+@([^.\s@]+\.)+[A-Za-z]{2,63}$/
      if (!emailRe.test(email)) errors.contactEmail = 'Email không hợp lệ'
    }

    // if phone provided, basic check (digits, +, spaces, dashes)
    if (form.contactPhone && String(form.contactPhone).trim().length > 0) {
      const phone = String(form.contactPhone).trim()
      const phoneRe = /^[+\d][\d ()-]{6,}$/
      if (!phoneRe.test(phone)) errors.contactPhone = 'Số điện thoại không hợp lệ'
    }

    // code: optional but if present, ensure no spaces
    if (form.code && String(form.code).includes(' ')) {
      errors.code = 'Mã không được chứa dấu cách'
    }

    // billingDay: optional but if present, must be between 1-31
    if (form.billingDay !== undefined && form.billingDay !== null) {
      const day = Number(form.billingDay)
      if (isNaN(day) || day < 1 || day > 31) {
        errors.billingDay = 'Ngày thanh toán phải từ 1 đến 31'
      }
    }

    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFieldErrors({})

    // run client-side validation first
    const ok = validateForm()
    if (!ok) {
      // focus handled by useEffect when fieldErrors is set
      setSubmitting(false)
      return
    }

    try {
      const payload = removeEmpty({ ...form })
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
        const anyErr = err as any
        // Axios error shape: anyErr.response?.data
        if (anyErr?.response?.data) {
          const data = anyErr.response.data
          const status = anyErr.response.status
          // Prefer structured fields and show the backend message directly in the toast
          const bodyMsg =
            typeof data === 'string'
              ? data
              : data?.message ||
                data?.error ||
                (data?.data && (data.data.message || data.data.error)) ||
                undefined

          if (bodyMsg) {
            // Show the backend message (e.g. "Customer with this name already exists")
            userMessage = String(bodyMsg)
          } else {
            // Fallback: include status and raw body for debugging
            userMessage = `${status} - ${JSON.stringify(data)}`
          }
        } else if (anyErr?.message) {
          userMessage = String(anyErr.message)
        } else if (err instanceof Error && err.message) {
          userMessage = err.message
        }
      } catch (parseErr) {
        console.error('Error parsing API error message', parseErr)
      }
      // Try to extract field-level validation errors and show them inline
      try {
        const anyErr2 = err as any
        const data = anyErr2?.response?.data
        const maybeErrors =
          data?.errors || data?.validation || data?.fieldErrors || data?.data?.errors
        const details = data?.details || data?.data?.details
        const newFieldErrors: Record<string, string> = {}

        if (maybeErrors && typeof maybeErrors === 'object') {
          // If it's an array of { field, message }
          if (Array.isArray(maybeErrors)) {
            for (const it of maybeErrors) {
              if (it?.field && it?.message) newFieldErrors[it.field] = String(it.message)
            }
          } else {
            // assume object map { field: message }
            for (const k of Object.keys(maybeErrors)) {
              const v = (maybeErrors as Record<string, any>)[k]
              if (typeof v === 'string') newFieldErrors[k] = v
              else if (Array.isArray(v) && v.length) newFieldErrors[k] = String(v[0])
              else if (v?.message) newFieldErrors[k] = String(v.message)
            }
          }
        }

        // Some backends include a `details` object with field/target info
        if (!Object.keys(newFieldErrors).length && details && typeof details === 'object') {
          const fld = details.field || (Array.isArray(details.target) && details.target[0])
          if (fld) {
            newFieldErrors[fld] = String(data?.message || data?.error || userMessage)
          }
        } else if (data?.field && data?.message) {
          newFieldErrors[data.field] = String(data.message)
        } else if (userMessage && anyErr2?.response?.status === 409) {
          // Common case: conflict on a specific field like name — attempt heuristic
          if (/name/i.test(userMessage)) newFieldErrors['name'] = userMessage
        }

        // Heuristic: if API message mentions field names (e.g. 'name' or 'code'), map them to field errors as well
        const msgLower = String(data?.message || data?.error || userMessage || '').toLowerCase()
        if (/\bname\b/.test(msgLower) && !newFieldErrors['name'])
          newFieldErrors['name'] = String(data?.message || userMessage)
        if (/\bcode\b/.test(msgLower) && !newFieldErrors['code'])
          newFieldErrors['code'] = String(data?.message || userMessage)

        if (Object.keys(newFieldErrors).length) setFieldErrors(newFieldErrors)
      } catch (innerErr) {
        console.error('Error extracting field errors', innerErr)
      }

      toast.error(userMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : mode === 'create' ? (
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
                    ref={nameRef}
                    value={form.name || ''}
                    onChange={(e) => {
                      setForm((s) => ({ ...s, name: e.target.value }))
                      clearFieldError('name')
                    }}
                    placeholder="Tên khách hàng"
                    className={`h-11 ${fieldErrors.name ? 'border-destructive focus-visible:ring-destructive/50' : ''}`}
                    required
                  />
                  {fieldErrors.name && (
                    <p className="text-destructive mt-1 text-sm">{fieldErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">Mã (code)</Label>
                  <Input
                    ref={codeRef}
                    value={form.code || ''}
                    onChange={(e) => {
                      setForm((s) => ({ ...s, code: e.target.value }))
                      clearFieldError('code')
                    }}
                    placeholder="Mã khách hàng (ví dụ ABC_CORP)"
                    className={`h-11 ${fieldErrors.code ? 'border-destructive focus-visible:ring-destructive/50' : ''}`}
                  />
                  {fieldErrors.code && (
                    <p className="text-destructive mt-1 text-sm">{fieldErrors.code}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">Email liên hệ</Label>
                  <Input
                    ref={contactEmailRef}
                    value={form.contactEmail || ''}
                    onChange={(e) => {
                      setForm((s) => ({ ...s, contactEmail: e.target.value }))
                      clearFieldError('contactEmail')
                    }}
                    placeholder="contact@company.com"
                    className={`h-11 ${fieldErrors.contactEmail ? 'border-destructive focus-visible:ring-destructive/50' : ''}`}
                    type="email"
                  />
                  {fieldErrors.contactEmail && (
                    <p className="text-destructive mt-1 text-sm">{fieldErrors.contactEmail}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">Số điện thoại</Label>
                  <Input
                    ref={contactPhoneRef}
                    value={form.contactPhone || ''}
                    onChange={(e) => {
                      setForm((s) => ({ ...s, contactPhone: e.target.value }))
                      clearFieldError('contactPhone')
                    }}
                    placeholder="+84123456789"
                    className={`h-11 ${fieldErrors.contactPhone ? 'border-destructive focus-visible:ring-destructive/50' : ''}`}
                  />
                  {fieldErrors.contactPhone && (
                    <p className="text-destructive mt-1 text-sm">{fieldErrors.contactPhone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">Người liên hệ</Label>
                  <Input
                    ref={contactPersonRef}
                    value={form.contactPerson || ''}
                    onChange={(e) => {
                      setForm((s) => ({ ...s, contactPerson: e.target.value }))
                      clearFieldError('contactPerson')
                    }}
                    placeholder="Tên người liên hệ"
                    className={`h-11 ${fieldErrors.contactPerson ? 'border-destructive focus-visible:ring-destructive/50' : ''}`}
                  />
                  {fieldErrors.contactPerson && (
                    <p className="text-destructive mt-1 text-sm">{fieldErrors.contactPerson}</p>
                  )}
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

                <div className="space-y-2">
                  <Label className="text-base font-semibold">Ngày thanh toán</Label>
                  <Input
                    ref={billingDayRef}
                    type="number"
                    min="1"
                    max="31"
                    value={
                      form.billingDay !== undefined && form.billingDay !== null
                        ? form.billingDay
                        : ''
                    }
                    onChange={(e) => {
                      const value = e.target.value
                      setForm((s) => ({
                        ...s,
                        billingDay: value === '' ? undefined : Number(value),
                      }))
                      clearFieldError('billingDay')
                    }}
                    placeholder="Nhập ngày (1-31)"
                    className={`h-11 ${fieldErrors.billingDay ? 'border-destructive focus-visible:ring-destructive/50' : ''}`}
                  />
                  {fieldErrors.billingDay && (
                    <p className="text-destructive mt-1 text-sm">{fieldErrors.billingDay}</p>
                  )}
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
                {(Array.isArray(form.address) && form.address.length > 0 ? form.address : ['']).map(
                  (addr, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        ref={idx === 0 ? addressRef : undefined}
                        value={addr || ''}
                        onChange={(e) => {
                          setForm((s) => {
                            const arr = Array.isArray(s.address) ? [...s.address] : []
                            arr[idx] = e.target.value
                            return { ...s, address: arr }
                          })
                          clearFieldError('address')
                        }}
                        placeholder={`Địa chỉ ${idx + 1}`}
                        className={`h-11 ${fieldErrors.address ? 'border-destructive focus-visible:ring-destructive/50' : ''} flex-1`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          setForm((s) => {
                            const arr = Array.isArray(s.address) ? [...s.address] : []
                            arr.splice(idx, 1)
                            return { ...s, address: arr }
                          })
                        }
                        disabled={!(Array.isArray(form.address) && form.address.length > 1)}
                        className="min-w-[64px]"
                      >
                        Xóa
                      </Button>
                    </div>
                  )
                )}

                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setForm((s) => ({
                        ...(s || {}),
                        address: [...(Array.isArray(s.address) ? s.address : []), ''],
                      }))
                    }
                  >
                    Thêm địa chỉ
                  </Button>
                </div>
                {fieldErrors.address && (
                  <p className="text-destructive mt-1 text-sm">{fieldErrors.address}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Mô tả</Label>
                <Input
                  ref={descriptionRef}
                  value={form.description || ''}
                  onChange={(e) => {
                    setForm((s) => ({ ...s, description: e.target.value }))
                    clearFieldError('description')
                  }}
                  placeholder="Ghi chú thêm về khách hàng"
                  className={`h-11 ${fieldErrors.description ? 'border-destructive focus-visible:ring-destructive/50' : ''}`}
                />
                {fieldErrors.description && (
                  <p className="text-destructive mt-1 text-sm">{fieldErrors.description}</p>
                )}
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
