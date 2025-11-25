'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

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
import { Loader2, User, Mail, Shield } from 'lucide-react'
import { getRolesForClient, updateUserForClient } from '@/lib/auth/data-actions'
import { useRoleAttributeSchema } from '@/lib/hooks/useRoleAttributeSchema'
import { DynamicAttributesFields } from '@/components/shared/DynamicAttributesFields'
import removeEmpty from '@/lib/utils/clean'
import type { User as UserType, UserRole } from '@/types/users'
import { toast } from 'sonner'

// Validation schema for editing user
const editUserSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  roleId: z.string().min(1, 'Vai trò là bắt buộc'),
  customerId: z.string().min(1, 'Khách hàng là bắt buộc'),
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
  // Dynamic attributes state (edit mode should start with user's existing attributes)
  const [attributes, setAttributes] = useState<Record<string, unknown>>(user?.attributes || {})
  const [attributeErrors, setAttributeErrors] = useState<Record<string, string>>({})

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      email: '',
      roleId: '',
      customerId: '',
    },
  })

  // Watch roleId so we can parse attribute schema
  const selectedRoleId = useWatch({ control: form.control, name: 'roleId' })
  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId),
    [roles, selectedRoleId]
  )

  const { schema: attributeSchema, validate: validateAttributes } = useRoleAttributeSchema(
    selectedRole?.attributeSchema
  )

  // Load roles and departments when modal opens
  useEffect(() => {
    if (isOpen) {
      loadRoles()
    }
  }, [isOpen])

  // Update form when user changes
  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email,
        roleId: user.roleId,
        customerId: user.customerId || '',
      })
      // ensure attributes state tracks the current user when opening edit modal
      setAttributes(user.attributes || {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadRoles = async () => {
    try {
      const rolesData = await getRolesForClient()
      setRoles(rolesData)
    } catch (error) {
      console.error('Error loading roles:', error)
      toast.error('Không thể tải danh sách vai trò')
    }
  }

  const onSubmit = async (data: EditUserFormData) => {
    if (!user) return

    // Validate dynamic attributes (when schema exists)
    if (attributeSchema) {
      const validation = validateAttributes(attributes)
      if (!validation.valid) {
        setAttributeErrors(validation.errors)
        toast.error('Vui lòng kiểm tra các thuộc tính bổ sung')
        return
      }
      setAttributeErrors({})
    }

    setIsLoading(true)
    try {
      // Ensure we send a proper customerId
      let customerIdToSend: string | undefined = data.customerId || undefined
      if (customerIdToSend && customerCodeToId[customerIdToSend]) {
        customerIdToSend = customerCodeToId[customerIdToSend]
      }

      // Build payload and remove empty fields so server won't receive blank strings
      const payload = removeEmpty({
        email: data.email,
        roleId: data.roleId,
        customerId: customerIdToSend,
        // only include attributes when the role defines a schema
        attributes: attributeSchema ? attributes : undefined,
      })

      // Update user
      const result = await updateUserForClient(user.id, payload)

      // If backend returned the updated user object -> success
      const isUser =
        result && typeof result === 'object' && 'id' in (result as Record<string, unknown>)

      if (isUser) {
        const updatedUser = result as UserType
        toast.success('✅ Cập nhật thông tin người dùng thành công')
        onUserUpdated(updatedUser)
        onClose()
      } else {
        // Handle structured error payload from backend (validation / 409)
        const err = result as any
        // Map field errors to react-hook-form if possible
        if (err?.errors && typeof err.errors === 'object') {
          Object.entries(err.errors).forEach(([field, messages]) => {
            const message = Array.isArray(messages) ? String(messages[0]) : String(messages)
            // Map to attribute errors if field targets attributes (e.g. attributes.x)
            if (typeof field === 'string' && field.startsWith('attributes.')) {
              const key = field.replace(/^attributes\./, '')
              setAttributeErrors((s) => ({ ...s, [key]: message }))
              return
            }

            // Only set known top-level form fields
            if (['email', 'roleId', 'customerId'].includes(field)) {
              form.setError(field as any, { type: 'server', message })
            }
          })
          toast.error('❌ Vui lòng kiểm tra các trường có lỗi')
        } else if (err?.message) {
          toast.error(String(err.message))
        } else if (err?.authExpired) {
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        } else {
          toast.error('❌ Có lỗi xảy ra khi cập nhật thông tin người dùng')
        }
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('❌ Có lỗi xảy ra khi cập nhật thông tin người dùng')
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
              className="min-w-[120px] bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
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
        <Form {...form}>
          <form id="edit-user-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-bold text-gray-800">
                    <Mail className="h-4 w-4 text-purple-600" />
                    Email *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nhập email người dùng"
                      type="email"
                      {...field}
                      className="h-10 rounded-lg border-2 border-gray-200 text-base transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                  </FormControl>
                  <FormMessage className="mt-1 text-xs text-red-600" />
                </FormItem>
              )}
            />

            {/* Grid: Role + Department */}
            <div className="grid grid-cols-2 gap-4">
              {/* Role Field */}
              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-bold text-gray-800">
                      <Shield className="h-4 w-4 text-pink-600" />
                      Vai trò *
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 rounded-lg border-2 border-gray-200 transition-all focus:border-pink-500 focus:ring-2 focus:ring-pink-200">
                          <SelectValue placeholder="Chọn vai trò" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{role.name}</span>
                              <span className="text-sm text-gray-500">Level {role.level}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="mt-1 text-xs text-red-600" />
                  </FormItem>
                )}
              />

              {/* Department Field */}
            </div>

            {/* Customer Field */}
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-bold text-gray-800">
                    <span className="text-lg">🏪</span>
                    Mã khách hàng *
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 rounded-lg border-2 border-gray-200 transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-200">
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
                          <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                            {code}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="mt-1 text-xs text-red-600" />
                </FormItem>
              )}
            />

            {/* Dynamic Attributes Fields (if any exist on the selected role) */}
            {attributeSchema && (
              <DynamicAttributesFields
                schema={attributeSchema}
                values={attributes}
                onChange={setAttributes}
                errors={attributeErrors}
                disabled={isLoading}
              />
            )}

            {/* Info card */}
            <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4">
              <p className="text-xs text-gray-700">
                <span className="font-bold text-blue-700">💡 Tip:</span> Các thay đổi sẽ được lưu
                ngay khi bạn nhấn "Cập nhật".
              </p>
            </div>
          </form>
        </Form>
      </SystemModalLayout>
    </Dialog>
  )
}
