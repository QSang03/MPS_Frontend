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
import { getRolesForClient } from '@/lib/auth/data-actions'
import { usersClientService } from '@/lib/api/services/users-client.service'
import { useRoleAttributeSchema } from '@/lib/hooks/useRoleAttributeSchema'
import { DynamicAttributesFields } from '@/components/shared/DynamicAttributesFields'
import removeEmpty from '@/lib/utils/clean'
import type { User as UserType, UserRole } from '@/types/users'
import { toast } from 'sonner'

// Default validation schema (English) for type inference
export const editUserSchemaDefault = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  fullName: z.string().min(1, 'Full name is required'),
  phone: z
    .string()
    .min(1, 'Phone is required')
    .regex(/^(0|\+84)[0-9]{9,10}$/, 'Invalid phone format'),
  roleAttribute: z.string().min(1, 'Department/Role is required'),
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
        fullName: z.string().min(1, t('user.field.fullName') + ' ' + t('common.is_required')),
        phone: z
          .string()
          .min(1, t('user.field.phone') + ' ' + t('common.is_required'))
          .regex(/^(0|\+84)[0-9]{9,10}$/, t('validation.phone_invalid')),
        roleAttribute: z
          .string()
          .min(1, t('user.field.role_attribute') + ' ' + t('common.is_required')),
        roleId: z.string().min(1, t('validation.role_required')),
        customerId: z.string().min(1, t('validation.customer_required')),
      }),
    [t]
  )

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(localEditUserSchema),
    defaultValues: {
      email: '',
      fullName: '',
      phone: '',
      roleAttribute: '',
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
          message: t('user.role_invalid_for_customer'),
        })
      } catch {}
    } else {
      try {
        form.clearErrors('roleId')
      } catch {}
    }
  }, [watchedCustomerCode, roles, allowedNonSys, form, user?.roleId, t])

  // Update form when user changes
  useEffect(() => {
    if (user) {
      const attrs = (user.attributes as Record<string, unknown>) || {}
      setAttributes(attrs)
      form.reset({
        email: user.email,
        fullName: (attrs.name as string) || user.fullName || '',
        phone: (attrs.phone as string) || user.phone || '',
        roleAttribute: (attrs.role as string) || '',
        roleId: user.roleId,
        customerId: user.customerId || '',
      })
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
        fullName: data.fullName, // Map fullName to fullName (reverted from name)
        roleId: data.roleId,
        customerId: customerIdToSend,
        // only include attributes when the role defines a schema
        attributes: {
          ...(attributeSchema ? attributes : {}),
          role: data.roleAttribute,
          phone: data.phone,
        },
      })

      // Validate role restriction when switching from SYS to non-SYS
      if (switchedFromSysToNonSys && !currentRoleAllowedForNonSys()) {
        toast.error(t('user.role_invalid_for_customer'))
        setIsLoading(false)
        return
      }

      // Update user
      const result = await usersClientService.updateUser(user.id, payload)

      toast.success(t('user.update_success'))
      onUserUpdated(result)
      onClose()
    } catch (error: unknown) {
      console.error('Update user failed:', error)
      const maybeErr = error as { responseData?: unknown; message?: string } | undefined
      const data = maybeErr?.responseData
      const message = maybeErr?.message || t('user.update_error')

      if (data && typeof data === 'object') {
        const errObj = data as { errors?: Array<{ field?: string; message?: string }> }
        if (Array.isArray(errObj.errors)) {
          errObj.errors.forEach((e) => {
            const field = e?.field
            const msg = e?.message
            if (
              typeof field === 'string' &&
              ['email', 'fullName', 'phone', 'roleAttribute', 'roleId', 'customerId'].includes(
                field
              )
            ) {
              form.setError(field as keyof EditUserFormData, {
                type: 'server',
                message: String(msg),
              })
            }
          })
          toast.error(t('validation.fields_error'))
        } else {
          toast.error(message)
        }
      } else {
        toast.error(message)
      }
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
              {t('user.role_invalid_sys_to_customer_warning')}
            </div>
          ) : null}
          <form id="edit-user-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-bold text-gray-800">
                    <User className="h-4 w-4 text-[var(--brand-600)]" />
                    {t('user.field.fullName')} <span className="text-muted-foreground">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('user.placeholder.fullName')}
                      {...field}
                      className="h-10 rounded-lg border-2 border-gray-200 text-base transition-all focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-200)]"
                    />
                  </FormControl>
                  <FormMessage className="mt-1 text-xs text-[var(--color-error-500)]" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-bold text-gray-800">
                      <span className="text-lg">📞</span>
                      {t('user.field.phone')} <span className="text-muted-foreground">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('user.placeholder.phone')}
                        {...field}
                        className="h-10 rounded-lg border-2 border-gray-200 text-base transition-all focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-200)]"
                      />
                    </FormControl>
                    <FormMessage className="mt-1 text-xs text-[var(--color-error-500)]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roleAttribute"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-bold text-gray-800">
                      <Shield className="h-4 w-4 text-[var(--brand-600)]" />
                      {t('user.field.role_attribute')}{' '}
                      <span className="text-muted-foreground">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('user.placeholder.role_attribute')}
                        {...field}
                        className="h-10 rounded-lg border-2 border-gray-200 text-base transition-all focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-200)]"
                      />
                    </FormControl>
                    <FormMessage className="mt-1 text-xs text-[var(--color-error-500)]" />
                  </FormItem>
                )}
              />
            </div>

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
                excludeKeys={['role', 'phone']}
              />
            )}

            {/* Info card */}
            <div className="rounded-lg border-2 border-[var(--brand-200)] bg-gradient-to-r from-[var(--brand-50)] to-[var(--brand-100)] p-4">
              <p className="text-xs text-gray-700">{t('user.update_tip')}</p>
            </div>
          </form>
        </Form>
      </SystemModalLayout>
    </Dialog>
  )
}
