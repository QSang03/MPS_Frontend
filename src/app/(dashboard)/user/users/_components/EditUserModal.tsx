'use client'

import { useState, useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
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
import { Button } from '@/components/ui/button'
import { Loader2, User, Mail } from 'lucide-react'
import { usersClientService } from '@/lib/api/services/users-client.service'
import { getRolesForClient } from '@/lib/auth/data-actions'
import { useRoleAttributeSchema } from '@/lib/hooks/useRoleAttributeSchema'
// Dynamic attributes fields component is not used here; import removed
import type { UserRole } from '@/types/users'
import type { User as UserType } from '@/types/users'
import { toast } from 'sonner'

// Validation schema for editing user
const editUserSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  roleId: z.string().min(1, 'Vai trò là bắt buộc'),
  customerId: z.string().optional(),
  departmentId: z.string().optional(),
})

type EditUserFormData = z.infer<typeof editUserSchema>

interface EditUserModalProps {
  user: UserType | null
  isOpen: boolean
  onClose: () => void
  onUserUpdated: (updatedUser: UserType) => void
  customerCodes?: string[]
  customerCodeToId?: Record<string, string>
}

export function EditUserModal({
  user,
  isOpen,
  onClose,
  onUserUpdated,
  customerCodes = [],
  customerCodeToId = {},
}: EditUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<UserRole[]>([])

  const [attributes, setAttributes] = useState<Record<string, unknown>>(user?.attributes || {})
  const [, setAttributeErrors] = useState<Record<string, string>>({})

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      email: '',
      roleId: '',
      customerId: '',
      departmentId: '',
    },
  })

  // (no auxiliary lists needed here)

  // Update form when user changes
  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email,
        roleId: user.roleId,
        customerId: user.customerId || '',
        departmentId: user.departmentId || '',
      })
      // ensure attributes state tracks the current user when opening edit modal
      setAttributes(user.attributes || {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // load roles when modal opens
  const loadRoles = async () => {
    try {
      const rolesData = await getRolesForClient()
      setRoles(rolesData)
    } catch (error) {
      console.error('Error loading roles:', error)
      toast.error('Không thể tải danh sách vai trò')
    }
  }

  useEffect(() => {
    if (isOpen) loadRoles()
  }, [isOpen])

  // watch role and derive attribute schema
  const selectedRoleId = useWatch({ control: form.control, name: 'roleId' })
  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId),
    [roles, selectedRoleId]
  )
  const { schema: attributeSchema, validate: validateAttributes } = useRoleAttributeSchema(
    selectedRole?.attributeSchema
  )

  const onSubmit = async (data: EditUserFormData) => {
    if (!user) return

    setIsLoading(true)
    try {
      // Ensure we send a proper customerId
      let customerIdToSend: string | undefined = data.customerId || undefined
      if (customerIdToSend && customerCodeToId[customerIdToSend]) {
        customerIdToSend = customerCodeToId[customerIdToSend]
      }

      // Validate dynamic attributes when role schema exists
      if (attributeSchema) {
        const validation = validateAttributes(attributes)
        if (!validation.valid) {
          setAttributeErrors(validation.errors)
          toast.error('Vui lòng kiểm tra các thuộc tính bổ sung')
          setIsLoading(false)
          return
        }
        setAttributeErrors({})
      }

      // Build payload
      const payload: Record<string, unknown> = {
        email: data.email,
        roleId: data.roleId,
      }

      if (customerIdToSend) {
        payload.customerId = customerIdToSend
      }

      if (data.departmentId) {
        payload.departmentId = data.departmentId
      }
      if (attributeSchema) {
        payload.attributes = attributes
      }
      // Update user
      const updatedUser = await usersClientService.updateUser(user.id, payload)

      toast.success('✅ Cập nhật thông tin người dùng thành công')
      onUserUpdated(updatedUser)
      onClose()
    } catch (error) {
      console.error('Error updating user:', error)

      // try to normalize backend error shape
      const resp = (error as unknown as { response?: { data?: unknown } })?.response?.data
      const _backend = resp as unknown as { message?: string; error?: string; details?: unknown }
      const message =
        _backend?.message ||
        _backend?.error ||
        (error instanceof Error ? error.message : 'Cập nhật người dùng thất bại')

      // Map structured errors
      const details = _backend.details as unknown
      if (details && typeof details === 'object') {
        const detailsObj = details as Record<string, unknown>

        // field-level errors array
        const maybeErrors = detailsObj.errors as unknown
        if (Array.isArray(maybeErrors) && maybeErrors.length > 0) {
          const errorFields: string[] = []
          for (const e of maybeErrors) {
            if (e && typeof e === 'object') {
              const field = (e as { field?: unknown }).field
              const msg = (e as { message?: unknown }).message || message
              if (typeof field === 'string') {
                // attribute.* → attributeErrors
                if (field.startsWith('attributes.')) {
                  const key = field.replace(/^attributes\./, '')
                  setAttributeErrors((s) => ({ ...s, [key]: String(msg) }))
                } else if (['email', 'roleId', 'customerId', 'departmentId'].includes(field)) {
                  try {
                    form.setError(field as keyof EditUserFormData, {
                      type: 'server',
                      message: String(msg),
                    })
                  } catch {
                    // ignore
                  }
                }
                errorFields.push(field)
              }
            }
          }

          if (errorFields.length > 0) {
            toast.error('❌ Vui lòng kiểm tra các trường có lỗi')
            setIsLoading(false)
            return
          }
        }

        // single field error
        const dField = detailsObj.field as unknown
        if (typeof dField === 'string') {
          const msg = (detailsObj.message as unknown) || message
          if (dField.startsWith('attributes.')) {
            const key = dField.replace(/^attributes\./, '')
            setAttributeErrors((s) => ({ ...s, [key]: String(msg) }))
            toast.error('❌ Vui lòng kiểm tra các trường có lỗi')
            setIsLoading(false)
            return
          }
          try {
            form.setError(dField as keyof EditUserFormData, {
              type: 'server',
              message: String(msg),
            })
          } catch {
            // ignore
          }
          toast.error('❌ Vui lòng kiểm tra các trường có lỗi')
          setIsLoading(false)
          return
        }

        // target array
        const maybeTarget = detailsObj.target as unknown
        if (Array.isArray(maybeTarget) && maybeTarget.length > 0) {
          for (const t of maybeTarget) {
            if (typeof t === 'string' && t.startsWith('attributes.')) {
              const key = t.replace(/^attributes\./, '')
              setAttributeErrors((s) => ({ ...s, [key]: String(message) }))
            } else if (typeof t === 'string') {
              try {
                form.setError(t as keyof EditUserFormData, {
                  type: 'server',
                  message: String(message),
                })
              } catch {
                // ignore
              }
            }
          }
          toast.error('❌ Vui lòng kiểm tra các trường có lỗi')
          setIsLoading(false)
          return
        }
      }

      // generic fallback
      toast.error(String(message))
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <SystemModalLayout
        title="Chỉnh sửa người dùng"
        description="Cập nhật thông tin và phân quyền cho người dùng"
        icon={User}
        variant="edit"
        footer={
          <>
            <Button type="button" variant="outline" onClick={handleClose} className="min-w-[100px]">
              Hủy
            </Button>
            <Button
              type="submit"
              form="edit-user-form"
              disabled={isLoading}
              className="min-w-[120px] bg-gradient-to-r from-orange-600 to-amber-400 hover:from-orange-700 hover:to-amber-500"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Cập nhật'
              )}
            </Button>
          </>
        }
      >
        {/* Form Content */}
        <div className="bg-background space-y-5 px-6 py-6">
          <Form {...form}>
            <form id="edit-user-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-medium">
                      <Mail className="text-muted-foreground h-4 w-4" />
                      Email *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập email người dùng" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Customer Field */}
              {customerCodes.length > 0 && (
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-medium">
                        <span className="text-lg">🏪</span>
                        Mã khách hàng
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn mã khách hàng">
                              {field.value &&
                                Object.entries(customerCodeToId).find(
                                  ([, id]) => id === field.value
                                )?.[0]}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customerCodes.map((code) => (
                            <SelectItem key={code} value={customerCodeToId[code] || code}>
                              <span className="bg-muted text-muted-foreground inline-block rounded px-2 py-0.5 text-xs font-bold">
                                {code}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Info card */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs text-blue-700">
                  <span className="font-bold">💡 Tip:</span> Các thay đổi sẽ được lưu ngay khi bạn
                  nhấn "Cập nhật".
                </p>
              </div>

              {/* Note: footer (buttons) are provided to SystemModalLayout so they are sticky */}
            </form>
          </Form>
        </div>
      </SystemModalLayout>
    </Dialog>
  )
}
