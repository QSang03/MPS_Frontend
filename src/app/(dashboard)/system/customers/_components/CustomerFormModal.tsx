'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
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
import { useLocale } from '@/components/providers/LocaleProvider'

// Axios-like error structure used for parsing error responses from server.
type AxiosLikeError = {
  response?: { data?: unknown; status?: number }
  message?: string
}

type LocalCustomerForm = Partial<Customer> & {
  code?: string
  contactEmail?: string
  contactPhone?: string
  contactPerson?: string
  tier?: string
  isActive?: boolean
  description?: string
  billingDay?: number
  defaultCurrencyId?: string | null
  invoiceInfo?: {
    billTo?: string
    address?: string
    att?: string
    hpPoRef?: string
    erpId?: string
    emails?: string[]
  }
}
import { Plus, Edit, Loader2, Building2, User, MapPin, CheckCircle2, FileText } from 'lucide-react'
import { CurrencySelector } from '@/components/currency/CurrencySelector'

interface Props {
  mode?: 'create' | 'edit'
  customer?: Customer | null
  onSaved?: (c?: Customer | null) => void
  // optional custom trigger element (used to render an edit button inside the table)
  trigger?: React.ReactNode
}

export function CustomerFormModal({ mode = 'create', customer = null, onSaved, trigger }: Props) {
  const { t } = useLocale()
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
    invoiceInfo: {
      billTo: '',
      address: '',
      att: '',
      hpPoRef: '',
      erpId: '',
      emails: [],
    },
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
        code: customer.code ?? '',
        // Normalize address to array
        address: Array.isArray(customer.address)
          ? customer.address
          : typeof customer.address === 'string' && customer.address
            ? [customer.address]
            : [],
        description: customer.description,
        contactEmail: customer.contactEmail,
        contactPhone: customer.contactPhone,
        contactPerson: customer.contactPerson,
        tier: customer.tier || 'BASIC',
        isActive: customer.isActive ?? true,
        billingDay: customer.billingDay,
        defaultCurrencyId: customer.defaultCurrencyId ?? null,
        invoiceInfo: customer.invoiceInfo
          ? {
              billTo: customer.invoiceInfo?.billTo || '',
              address: customer.invoiceInfo?.address || '',
              att: customer.invoiceInfo?.att || '',
              hpPoRef: customer.invoiceInfo?.hpPoRef || '',
              erpId: customer.invoiceInfo?.erpId || '',
              emails: Array.isArray(customer.invoiceInfo?.emails)
                ? customer.invoiceInfo.emails
                : [],
            }
          : { billTo: '', address: '', att: '', hpPoRef: '', erpId: '', emails: [] },
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
        errors.billingDay = 'ngày lấy số liệu phải từ 1 đến 31'
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
        toast.success(t('customer.create_success'))
        setOpen(false)
        onSaved?.(created || null)
      } else if (customer) {
        const updated = await customersClientService.update(
          customer.id,
          payload as Partial<Customer>
        )
        toast.success(t('customer.update_success'))
        setOpen(false)
        onSaved?.(updated || null)
      }
    } catch (err) {
      console.error('Customer save error', err)
      let userMessage = 'Có lỗi khi lưu khách hàng'
      try {
        type AxiosLikeError = {
          response?: { data?: unknown; status?: number }
          message?: string
        }
        const anyErr = err as AxiosLikeError
        // Axios error shape: anyErr.response?.data
        if (anyErr?.response?.data) {
          const data = anyErr.response?.data as unknown
          const status = anyErr.response?.status
          const dd =
            data && typeof data === 'object' ? (data as Record<string, unknown>) : undefined
          // Prefer structured fields and show the backend message directly in the toast
          const bodyMsg =
            typeof data === 'string'
              ? data
              : dd
                ? (dd['message'] as string) ||
                  (dd['error'] as string) ||
                  ((dd['data'] as Record<string, unknown> | undefined) &&
                    (((dd['data'] as Record<string, unknown>)['message'] as string) ||
                      ((dd['data'] as Record<string, unknown>)['error'] as string)))
                : undefined

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
        const anyErr2 = err as AxiosLikeError
        const data = anyErr2?.response?.data as unknown
        const dd = data && typeof data === 'object' ? (data as Record<string, unknown>) : undefined
        const ddData =
          dd && dd['data'] && typeof dd['data'] === 'object'
            ? (dd['data'] as Record<string, unknown>)
            : undefined
        const maybeErrors =
          dd && (dd['errors'] || dd['validation'] || dd['fieldErrors'] || ddData?.['errors'])
        const details = dd && (dd['details'] || ddData?.['details'])
        const newFieldErrors: Record<string, string> = {}

        if (maybeErrors && typeof maybeErrors === 'object') {
          // If it's an array of { field, message }
          if (Array.isArray(maybeErrors)) {
            for (const it of maybeErrors as Array<Record<string, unknown>>) {
              if (it && typeof it === 'object' && 'field' in it && 'message' in it) {
                const fld = (it as Record<string, unknown>)['field']
                const msg = (it as Record<string, unknown>)['message']
                if (typeof fld === 'string' && msg) newFieldErrors[fld] = String(msg)
              }
            }
          } else {
            // assume object map { field: message }
            for (const k of Object.keys(maybeErrors as Record<string, unknown>)) {
              const v = (maybeErrors as Record<string, unknown>)[k]
              if (typeof v === 'string') newFieldErrors[k] = v
              else if (Array.isArray(v) && v.length) newFieldErrors[k] = String((v as unknown[])[0])
              else if (
                typeof v === 'object' &&
                v !== null &&
                'message' in (v as Record<string, unknown>)
              )
                newFieldErrors[k] = String((v as Record<string, unknown>)['message'])
            }
          }
        }

        // Some backends include a `details` object with field/target info
        if (!Object.keys(newFieldErrors).length && details && typeof details === 'object') {
          const fld =
            (details as Record<string, unknown>)['field'] ||
            (Array.isArray((details as Record<string, unknown>)['target']) &&
              ((details as Record<string, unknown>)['target'] as unknown[])[0])
          if (fld) {
            newFieldErrors[String(fld)] = String(
              (dd && (dd['message'] as string)) || (dd && (dd['error'] as string)) || userMessage
            )
          }
        } else if (dd && dd['field'] && ((dd['message'] as string) || (dd['error'] as string))) {
          newFieldErrors[String(dd['field'])] = String(
            (dd['message'] as string) || (dd['error'] as string)
          )
        } else if (userMessage && anyErr2?.response?.status === 409) {
          // Common case: conflict on a specific field like name — attempt heuristic
          if (/name/i.test(userMessage)) newFieldErrors['name'] = userMessage
        }

        // Heuristic: if API message mentions field names (e.g. 'name' or 'code'), map them to field errors as well
        const msgLower = String(
          (dd && ((dd['message'] as string) || (dd['error'] as string))) || userMessage || ''
        ).toLowerCase()
        if (/\bname\b/.test(msgLower) && !newFieldErrors['name'])
          newFieldErrors['name'] = String((dd && (dd['message'] as string)) || userMessage)
        if (/\bcode\b/.test(msgLower) && !newFieldErrors['code'])
          newFieldErrors['code'] = String((dd && (dd['message'] as string)) || userMessage)

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

      <SystemModalLayout
        title={mode === 'create' ? 'Tạo khách hàng mới' : 'Chỉnh sửa khách hàng'}
        description={
          mode === 'create' ? 'Thêm khách hàng vào hệ thống' : 'Cập nhật thông tin khách hàng'
        }
        icon={mode === 'create' ? Building2 : Edit}
        variant={mode}
        maxWidth="max-w-[720px]"
        footer={
          <>
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
              form="customer-form"
              className="min-w-[140px] bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
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
          </>
        }
      >
        <form id="customer-form" onSubmit={handleSubmit} className="space-y-6">
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
                  disabled={mode === 'edit' && (customer?.code ?? '').toUpperCase() === 'SYS'}
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
                <Label className="text-base font-semibold">ngày lấy số liệu</Label>
                <Input
                  ref={billingDayRef}
                  type="number"
                  min="1"
                  max="31"
                  value={
                    form.billingDay !== undefined && form.billingDay !== null ? form.billingDay : ''
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

              <div className="space-y-2">
                <CurrencySelector
                  label="Tiền tệ mặc định"
                  value={form.defaultCurrencyId ?? null}
                  onChange={(value) => {
                    setForm((s) => ({ ...s, defaultCurrencyId: value ?? null }))
                  }}
                  optional
                  placeholder="Chọn tiền tệ mặc định"
                  customerId={customer?.id}
                />
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
              <FileText className="h-4 w-4" />
              Thông tin hóa đơn
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Bill To</Label>
                <Input
                  value={form.invoiceInfo?.billTo || ''}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      invoiceInfo: { ...(s.invoiceInfo || {}), billTo: e.target.value },
                    }))
                  }
                  placeholder="Tên người/đơn vị nhận hóa đơn"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Invoice Address</Label>
                <Input
                  value={form.invoiceInfo?.address || ''}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      invoiceInfo: { ...(s.invoiceInfo || {}), address: e.target.value },
                    }))
                  }
                  placeholder="Địa chỉ nhận hóa đơn"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">ATT</Label>
                <Input
                  value={form.invoiceInfo?.att || ''}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      invoiceInfo: { ...(s.invoiceInfo || {}), att: e.target.value },
                    }))
                  }
                  placeholder="Người nhận"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">HP / PO Ref</Label>
                <Input
                  value={form.invoiceInfo?.hpPoRef || ''}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      invoiceInfo: { ...(s.invoiceInfo || {}), hpPoRef: e.target.value },
                    }))
                  }
                  placeholder="Số PO/Ref"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">ERP ID</Label>
                <Input
                  value={form.invoiceInfo?.erpId || ''}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      invoiceInfo: { ...(s.invoiceInfo || {}), erpId: e.target.value },
                    }))
                  }
                  placeholder="Mã ERP"
                  className="h-11"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-base font-semibold">Email hóa đơn</Label>
                {(Array.isArray(form.invoiceInfo?.emails) && form.invoiceInfo!.emails!.length > 0
                  ? form.invoiceInfo!.emails!
                  : ['']
                ).map((em, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={em || ''}
                      onChange={(e) =>
                        setForm((s) => {
                          const emails = Array.isArray(s.invoiceInfo?.emails)
                            ? [...(s.invoiceInfo?.emails || [])]
                            : []
                          emails[idx] = e.target.value
                          return { ...s, invoiceInfo: { ...(s.invoiceInfo || {}), emails } }
                        })
                      }
                      placeholder={`invoice${idx + 1}@example.com`}
                      className="h-11 flex-1"
                      type="email"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setForm((s) => {
                          const emails = Array.isArray(s.invoiceInfo?.emails)
                            ? [...(s.invoiceInfo?.emails || [])]
                            : []
                          emails.splice(idx, 1)
                          return { ...s, invoiceInfo: { ...(s.invoiceInfo || {}), emails } }
                        })
                      }
                      disabled={
                        !(
                          Array.isArray(form.invoiceInfo?.emails) &&
                          form.invoiceInfo!.emails!.length > 1
                        )
                      }
                      className="min-w-[64px]"
                    >
                      Xóa
                    </Button>
                  </div>
                ))}

                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setForm((s) => ({
                        ...(s || {}),
                        invoiceInfo: {
                          ...(s.invoiceInfo || {}),
                          emails: [
                            ...(Array.isArray(s.invoiceInfo?.emails) ? s.invoiceInfo!.emails! : []),
                            '',
                          ],
                        },
                      }))
                    }
                  >
                    Thêm email
                  </Button>
                </div>
              </div>
            </div>
          </div>

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
        </form>
      </SystemModalLayout>
    </Dialog>
  )
}

export default CustomerFormModal
