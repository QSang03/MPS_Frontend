'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
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

// Default validation schema (English) for type inference
export const editUserSchemaDefault = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  roleId: z.string().min(1, 'Role is required'),
  customerId: z.string().min(1, 'Customer is required'),
})

type EditUserFormData = z.infer<typeof editUserSchemaDefault>

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
  const { t } = useLocale()
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<UserRole[]>([])
  // Dynamic attributes state (edit mode should start with user's existing attributes)
  const [attributes, setAttributes] = useState<Record<string, unknown>>(user?.attributes || {})
  const [attributeErrors, setAttributeErrors] = useState<Record<string, string>>({})

  const localEditUserSchema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .min(1, t('validation.email_required'))
          .email(t('validation.email_invalid')),
        roleId: z.string().min(1, t('validation.role_required')),
        customerId: z.string().min(1, t('validation.customer_required')),
      }),
    [t]
  )

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(localEditUserSchema),
    defaultValues: {
      email: '',
      roleId: '',
      customerId: '',
    },
  })

  // Watch selected customerId and determine its code via passed mapping
  const watchedCustomerId = useWatch({ control: form.control, name: 'customerId' })
  const watchedCustomerCode = useMemo(() => {
    if (!watchedCustomerId) return null
    const found = Object.entries(customerCodeToId).find(([, id]) => id === watchedCustomerId)
    return found ? found[0] : null
  }, [watchedCustomerId, customerCodeToId])

  // compute whether we switched from SYS to non-SYS and whether current role is allowed
  const initialCustomerCode = user?.customer?.code ?? null
  const switchedFromSysToNonSys =
    initialCustomerCode === 'SYS' && watchedCustomerCode && watchedCustomerCode !== 'SYS'
  const allowedNonSys = useMemo(() => new Set(['manager', 'user']), [])
  const nonSysOnly = watchedCustomerCode && watchedCustomerCode !== 'SYS'
  const roleOptions = useMemo(() => {
    if (!nonSysOnly) return roles
    return roles.filter(
      (r) => allowedNonSys.has(r.id.toLowerCase()) || allowedNonSys.has(r.name.toLowerCase())
    )
  }, [roles, nonSysOnly, allowedNonSys])
  const currentRoleId = () => form.getValues('roleId') || user?.roleId || ''
  const currentRoleObj = () => roles.find((r) => r.id === currentRoleId())
  const currentRoleAllowedForNonSys = () => {
    const r = currentRoleObj()
    if (!r) return false
    return allowedNonSys.has(r.id.toLowerCase()) || allowedNonSys.has(r.name.toLowerCase())
  }
  const blockSaveDueToRoleMismatch = switchedFromSysToNonSys && !currentRoleAllowedForNonSys()

  // Watch roleId so we can parse attribute schema
  const selectedRoleId = useWatch({ control: form.control, name: 'roleId' })
  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId),
    [roles, selectedRoleId]
  )

  const { schema: attributeSchema, validate: validateAttributes } = useRoleAttributeSchema(
    selectedRole?.attributeSchema
  )

  const loadRoles = useCallback(async () => {
    try {
      const rolesData = await getRolesForClient()
      setRoles(rolesData)
    } catch (error) {
      console.error('Error loading roles:', error)
      toast.error(t('error.loading_roles'))
    }
  }, [t])

  // Load roles and departments when modal opens
  useEffect(() => {
    if (isOpen) {
      loadRoles()
    }
  }, [isOpen, loadRoles])

  // When watchedCustomerCode changes, enforce role restrictions by clearing or setting errors
  useEffect(() => {
    if (!watchedCustomerCode) return
    const nonSys = watchedCustomerCode !== 'SYS'
    if (!nonSys) {
      // clear any role errors
      try {
        form.clearErrors('roleId')
      } catch {}
      return
    }
    // if the current role is not allowed, in edit mode set an error and block save, in create we could clear
    const r = roles.find((ro) => ro.id === (form.getValues('roleId') || user?.roleId || ''))
    const allowed = r
      ? allowedNonSys.has(r.id.toLowerCase()) || allowedNonSys.has(r.name.toLowerCase())
      : false
    if (!allowed) {
      // Set a form error so the user sees what's wrong (don't auto-clear on edit)
      try {
        form.setError('roleId', {
          type: 'manual',
          message: 'Vai trò không hợp lệ cho khách hàng hiện tại',
        })
      } catch {}
    } else {
      try {
        form.clearErrors('roleId')
      } catch {}
    }
  }, [watchedCustomerCode, roles, allowedNonSys, form, user?.roleId])

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
  }, [user, form])

  const onSubmit = async (data: EditUserFormData) => {
    if (!user) return

    // Validate dynamic attributes (when schema exists)
    if (attributeSchema) {
      const validation = validateAttributes(attributes)
      if (!validation.valid) {
        setAttributeErrors(validation.errors)
        toast.error(t('error.check_attributes'))
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

      // Validate role restriction when switching from SYS to non-SYS
      if (switchedFromSysToNonSys && !currentRoleAllowedForNonSys()) {
        toast.error(t('user.role_invalid_for_customer'))
        setIsLoading(false)
        return
      }

      // Update user
      const result = await updateUserForClient(user.id, payload)

      // If backend returned the updated user object -> success
      const isUser =
        result && typeof result === 'object' && 'id' in (result as Record<string, unknown>)

      if (isUser) {
        const updatedUser = result as UserType
        toast.success(t('user.update_success'))
        onUserUpdated(updatedUser)
        onClose()
      } else {
        // Handle structured error payload from backend (validation / 409)
        const err = result as unknown
        // Map field errors to react-hook-form if possible
        if (
          err &&
          typeof err === 'object' &&
          'errors' in err &&
          typeof (err as Record<string, unknown>).errors === 'object'
        ) {
          const errorsObj = (err as Record<string, unknown>).errors as Record<string, unknown>
          Object.entries(errorsObj).forEach(([field, messages]) => {
            const message = Array.isArray(messages) ? String(messages[0]) : String(messages)
            // Map to attribute errors if field targets attributes (e.g. attributes.x)
            if (typeof field === 'string' && field.startsWith('attributes.')) {
              const key = field.replace(/^attributes\./, '')
              setAttributeErrors((s) => ({ ...s, [key]: message }))
              return
            }

            // Only set known top-level form fields
            if (['email', 'roleId', 'customerId'].includes(field)) {
              form.setError(field as keyof EditUserFormData, { type: 'server', message })
            }
          })
          toast.error(t('validation.fields_error'))
        } else if (err && typeof err === 'object' && 'message' in err) {
          toast.error(String((err as { message?: string } | undefined)?.message ?? ''))
        } else if (
          err &&
          typeof err === 'object' &&
          'authExpired' in err &&
          (err as { authExpired?: boolean } | undefined)?.authExpired
        ) {
          toast.error(t('error.auth_expired'))
        } else {
          toast.error(t('user.update_error'))
        }
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error(t('user.update_error'))
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
        title={t('user.edit_title')}
        description={t('user.edit_description')}
        icon={User}
        variant="edit"
        footer={
          <>
            <Button type="button" variant="outline" onClick={handleClose} className="min-w-[100px]">
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              form="edit-user-form"
              disabled={Boolean(isLoading || blockSaveDueToRoleMismatch)}
              className="min-w-[120px] bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('button.processing')}
                </>
              ) : (
                t('button.update')
              )}
            </Button>
          </>
        }
      >
        <Form {...form}>
          {blockSaveDueToRoleMismatch ? (
            <div className="border-destructive/60 bg-destructive/10 text-destructive rounded border-2 p-3 text-sm">
              <div className="mb-1 font-medium">
                Cảnh báo: Vai trò hiện tại không hợp lệ khi chuyển từ khách hàng{' '}
                <strong>SYS</strong> sang khách hàng khác.
              </div>
              <div className="text-sm">
                Vui lòng chọn vai trò <strong>Manager</strong> hoặc <strong>User</strong> để tiếp
                tục.
              </div>
            </div>
          ) : null}
          <form id="edit-user-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-bold text-gray-800">
                    <Mail className="h-4 w-4 text-[var(--brand-600)]" />
                    {t('user.email')} <span className="text-muted-foreground">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('user.email_placeholder')}
                      type="email"
                      {...field}
                      className="h-10 rounded-lg border-2 border-gray-200 text-base transition-all focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-200)]"
                    />
                  </FormControl>
                  <FormMessage className="mt-1 text-xs text-[var(--color-error-500)]" />
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
                      {t('filters.role_label')} <span className="text-muted-foreground">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!watchedCustomerId}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 rounded-lg border-2 border-gray-200 transition-all focus:border-pink-500 focus:ring-2 focus:ring-pink-200">
                          <SelectValue placeholder={t('filters.select_role_placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{role.name}</span>
                              <span className="text-sm text-gray-500">Level {role.level}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="mt-1 text-xs text-[var(--color-error-500)]" />
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
                    {t('user.customer_code')} <span className="text-muted-foreground">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 rounded-lg border-2 border-gray-200 transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-200">
                        <SelectValue placeholder={t('filters.select_customer_placeholder')}>
                          {watchedCustomerCode && (
                            <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                              {watchedCustomerCode}
                            </span>
                          )}
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
                  <FormMessage className="mt-1 text-xs text-[var(--color-error-500)]" />
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
            <div className="rounded-lg border-2 border-[var(--brand-200)] bg-gradient-to-r from-[var(--brand-50)] to-[var(--brand-100)] p-4">
              <p className="text-xs text-gray-700">
                <span className="font-bold text-[var(--brand-700)]">💡 Tip:</span> Các thay đổi sẽ
                được lưu ngay khi bạn nhấn "Cập nhật".
              </p>
            </div>
          </form>
        </Form>
      </SystemModalLayout>
    </Dialog>
  )
}
