'use client'

import { useForm, useWatch } from 'react-hook-form'
import { useState, useMemo, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import CustomerSelect from '@/components/shared/CustomerSelect'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { DynamicAttributesFields } from '@/components/shared/DynamicAttributesFields'
import { userSchema, type UserFormData } from '@/lib/validations/user.schema'
import removeEmpty from '@/lib/utils/clean'
import { getRolesForClient } from '@/lib/auth/data-actions'
import { usersClientService } from '@/lib/api/services/users-client.service'
import { useRoleAttributeSchema } from '@/lib/hooks/useRoleAttributeSchema'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import type { User } from '@/types/users'

type BackendDetails = {
  errors?: Array<{ field?: string; message?: string }>
  field?: string
  message?: string
  target?: string[]
}

interface UserFormProps {
  initialData?: User
  mode: 'create' | 'edit'
  onSuccess?: () => void
  customerId?: string
}

export function UserForm({ initialData, mode, onSuccess, customerId }: UserFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { t } = useLocale()

  // Fetch roles
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: getRolesForClient,
  })

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: initialData?.email || '',
      fullName: initialData?.fullName || '',
      phone:
        ((initialData?.attributes as Record<string, unknown>)?.phone as string) ||
        initialData?.phone ||
        '',
      roleAttribute: ((initialData?.attributes as Record<string, unknown>)?.role as string) || '',
      customerId: initialData?.customerId || customerId || '',
      roleId: initialData?.roleId || '',
    },
  })

  // Helper type for dynamic form field names returned by the server
  type FormFieldName = Parameters<typeof form.setError>[0]

  const [serverError, setServerError] = useState<string | null>(null)

  // Dynamic attributes state
  const [attributes, setAttributes] = useState<Record<string, unknown>>(
    initialData?.attributes || {}
  )
  const [attributeErrors, setAttributeErrors] = useState<Record<string, string>>({})

  // Watch selected role to get its schema (use useWatch to avoid incompatible-library warning)
  const selectedRoleId = useWatch({ control: form.control, name: 'roleId' })
  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId),
    [roles, selectedRoleId]
  )

  // Watch selected customer and fetch its code to apply the role rules
  const watchedCustomerId = useWatch({ control: form.control, name: 'customerId' })
  const [watchedCustomerCode, setWatchedCustomerCode] = useState<string | null>(
    initialData?.customer?.code ?? null
  )

  useEffect(() => {
    let active = true
    if (!watchedCustomerId) {
      setTimeout(() => setWatchedCustomerCode(null), 0)
      return
    }
    ;(async () => {
      try {
        const c = await customersClientService.getById(watchedCustomerId)
        if (active) setWatchedCustomerCode(c?.code ?? null)
      } catch {
        if (active) setWatchedCustomerCode(null)
      }
    })()
    return () => {
      active = false
    }
  }, [watchedCustomerId])

  // If the customer becomes non-SYS, ensure the selected role is within allowed set
  useEffect(() => {
    if (!watchedCustomerCode) return
    const nonSys = watchedCustomerCode !== 'SYS'
    if (!nonSys) {
      // remove role field error if any
      try {
        form.clearErrors('roleId')
      } catch {}
      return
    }
    const allowedNonSys = new Set(['manager', 'user'])
    const currentRole = form.getValues('roleId') || initialData?.roleId || ''
    const roleObj = roles.find((r) => r.id === currentRole)
    const allowed = roleObj
      ? allowedNonSys.has(roleObj.id.toLowerCase()) || allowedNonSys.has(roleObj.name.toLowerCase())
      : false
    if (!allowed) {
      // For create: clear the select and show a toast
      if (mode === 'create') {
        form.setValue('roleId', '')
        toast.warning(t('user.role_invalid_for_customer'))
      } else {
        // For edit: set a validation error but keep the value for admins to correct
        try {
          form.setError('roleId', {
            type: 'manual',
            message: t('user.role.invalid_for_customer'),
          })
        } catch {}
      }
    }
  }, [watchedCustomerCode, roles, form, initialData?.roleId, mode, t])

  // Parse role attribute schema
  const { schema: attributeSchema, validate: validateAttributes } = useRoleAttributeSchema(
    selectedRole?.attributeSchema
  )

  // Reset attributes when role changes (schedule state update to avoid synchronous setState in effect)
  useEffect(() => {
    if (mode === 'create' && selectedRoleId !== initialData?.roleId) {
      const t = setTimeout(() => {
        setAttributes({})
        setAttributeErrors({})
      }, 0)
      return () => clearTimeout(t)
    }
    return undefined
  }, [selectedRoleId, initialData?.roleId, mode])

  // Use usersClientService instead of Server Action
  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => usersClientService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(t('user.create_success'))
      form.reset()
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/system/users')
      }
    },
    onError: (error: unknown) => {
      const resp = (error as unknown as { response?: { data?: unknown } })?.response?.data
      // Normalize backend error shape to a typed view so we can read fields without `any`
      type BackendDetails = {
        errors?: Array<{ field?: string; message?: string }>
        field?: string
        message?: string
        target?: string[]
      }

      const _backend = resp as unknown as {
        message?: string
        error?: string
        details?: BackendDetails | undefined
      }
      const message =
        _backend.message ||
        _backend.error ||
        (error instanceof Error ? error.message : t('user.create_error'))
      const details = _backend.details as BackendDetails | undefined

      setServerError(message)
      // Collect a list of fields to mark as errored
      const errorFields: string[] = []
      if (Array.isArray(details?.errors) && details.errors.length > 0) {
        for (const e of details.errors) {
          if (e?.field) {
            // per-field message if provided, otherwise fallback to overall message
            const msg = e?.message || _backend.message || _backend.error || message
            try {
              form.setError(e.field as FormFieldName, { type: 'server', message: msg })
            } catch {
              // ignore
            }
            errorFields.push(e.field)
          }
        }
      } else if (details?.field) {
        // single field
        const msg = details?.message || _backend.message || _backend.error || message
        try {
          form.setError(details.field as FormFieldName, { type: 'server', message: msg })
        } catch {
          // ignore
        }
        errorFields.push(details.field)
      } else if (Array.isArray(details?.target) && details.target.length > 0) {
        for (const t of details.target) {
          const msg = _backend.message || _backend.error || message
          try {
            form.setError(t as FormFieldName, { type: 'server', message: msg })
          } catch {
            // ignore
          }
          errorFields.push(t)
        }
      }

      // Focus the first errored field (slight delay to ensure DOM ready)
      const first = errorFields[0]
      if (first) {
        try {
          if (typeof form.setFocus === 'function') {
            // small timeout so focus can occur reliably
            setTimeout(() => {
              ;(form.setFocus as unknown as (name: string) => void)(first)
            }, 50)
          } else if (typeof document !== 'undefined') {
            setTimeout(() => {
              const el = document.querySelector(`[name="${first}"]`) as HTMLElement | null
              el?.focus()
            }, 50)
          }
        } catch {
          // ignore
        }
      }

      toast.error(message)
    },
  })

  // Use usersClientService instead of Server Action
  const updateMutation = useMutation({
    mutationFn: (data: UserFormData) => usersClientService.updateUser(initialData!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(t('user.update_success'))
      form.reset()
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/system/users')
      }
    },
    onError: (error: unknown) => {
      const resp = (error as unknown as { response?: { data?: unknown } })?.response?.data
      const _backend = resp as unknown as {
        message?: string
        error?: string
        details?: BackendDetails | undefined
      }
      const message =
        _backend.message || (error instanceof Error ? error.message : t('user.update_error'))
      const details = _backend.details as BackendDetails | undefined

      setServerError(message)

      const errorFields: string[] = []
      if (Array.isArray(details?.errors) && details.errors.length > 0) {
        for (const e of details.errors) {
          if (e?.field) {
            const msg = e?.message || message
            try {
              form.setError(e.field as FormFieldName, { type: 'server', message: msg })
            } catch {
              // ignore
            }
            errorFields.push(e.field)
          }
        }
      } else if (details?.field) {
        try {
          form.setError(details.field as FormFieldName, { type: 'server', message })
        } catch {
          // ignore
        }
        errorFields.push(details.field)
      } else if (Array.isArray(details?.target) && details.target.length > 0) {
        for (const t of details.target) {
          try {
            form.setError(t as FormFieldName, { type: 'server', message })
          } catch {
            // ignore
          }
          errorFields.push(t)
        }
      }

      const first = errorFields[0]
      if (first) {
        try {
          if (typeof form.setFocus === 'function') {
            setTimeout(() => {
              ;(form.setFocus as unknown as (name: string) => void)(first)
            }, 50)
          } else if (typeof document !== 'undefined') {
            setTimeout(() => {
              const el = document.querySelector(`[name="${first}"]`) as HTMLElement | null
              el?.focus()
            }, 50)
          }
        } catch {
          // ignore
        }
      }

      toast.error(message)
    },
  })

  const onSubmit = (data: UserFormData) => {
    // Validate attributes if schema exists
    if (attributeSchema) {
      const validation = validateAttributes(attributes)
      if (!validation.valid) {
        setAttributeErrors(validation.errors)
        toast.error(t('user.attribute_validation_error'))
        return
      }
      setAttributeErrors({})
    }

    // Remove empty fields so backend won't receive blank strings
    const payload = removeEmpty({
      ...data,
      fullName: data.fullName, // Map fullName to fullName (reverted from name)
      attributes: {
        ...(attributeSchema ? attributes : {}),
        role: data.roleAttribute,
        phone: data.phone,
      },
      phone: undefined, // Remove top-level field if it was in schema
      roleAttribute: undefined, // Remove temporary field
    } as unknown as Record<string, unknown>)

    if (mode === 'create') {
      createMutation.mutate(payload as UserFormData)
    } else {
      // Prevent saving if role is not allowed after switching customer from SYS to non-SYS
      if (
        mode === 'edit' &&
        initialData?.customer?.code === 'SYS' &&
        watchedCustomerCode &&
        watchedCustomerCode !== 'SYS'
      ) {
        const currentRole = (payload as UserFormData).roleId || initialData?.roleId
        const allowedNonSys = new Set(['manager', 'user'])
        const allowed = roles.some(
          (r) =>
            r.id === currentRole &&
            (allowedNonSys.has(r.id.toLowerCase()) || allowedNonSys.has(r.name.toLowerCase()))
        )
        if (!allowed) {
          toast.error(t('user.role.invalid_sys_to_customer'))
          return
        }
      }
      updateMutation.mutate(payload as UserFormData)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  // Determine if role editing/saving should be blocked when switching from SYS to non-SYS
  const initialCustomerCode = initialData?.customer?.code ?? null
  const switchedFromSysToNonSys =
    mode === 'edit' &&
    initialCustomerCode === 'SYS' &&
    watchedCustomerCode &&
    watchedCustomerCode !== 'SYS'
  const allowedNonSys = new Set(['manager', 'user'])
  // current role id (from form or initial data)
  const currentRoleId = selectedRoleId || initialData?.roleId || ''
  const currentRoleObj = roles.find((r) => r.id === currentRoleId)
  const currentRoleAllowedForNonSys = currentRoleObj
    ? allowedNonSys.has(currentRoleObj.id.toLowerCase()) ||
      allowedNonSys.has(currentRoleObj.name.toLowerCase())
    : false
  const blockSaveDueToRoleMismatch = switchedFromSysToNonSys && !currentRoleAllowedForNonSys

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Top-level error summary (show server/general + field errors) */}
        {serverError ||
        Object.keys(form.formState.errors).length > 0 ||
        blockSaveDueToRoleMismatch ? (
          <div className="border-destructive/60 bg-destructive/10 text-destructive rounded border-2 p-3 text-sm">
            {serverError && <div className="mb-1 font-medium">{serverError}</div>}
            <ul className="list-disc pl-5">
              {Object.entries(form.formState.errors).map(([k, v]) => (
                <li key={k}>{String(v?.message ?? k)}</li>
              ))}
            </ul>
            {blockSaveDueToRoleMismatch ? (
              <div className="mt-2 text-sm">
                <strong>{t('common.warning')}:</strong>{' '}
                {t('user.role.invalid_sys_to_customer_warning')}
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormDescription>{t('user.form.email_description')}</FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('user.field.phone')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('user.placeholder.phone')}
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormDescription>{t('user.field.phone_description')}</FormDescription>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('user.form.full_name')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('user.placeholder.fullName')}
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormDescription>{t('user.form.full_name_description')}</FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="roleAttribute"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('user.field.role_attribute')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('user.placeholder.role_attribute')}
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormDescription>{t('user.field.role_attribute_description')}</FormDescription>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('user.form.customer')}</FormLabel>
              <FormControl>
                <ActionGuard pageId="users" actionId="read-customer-for-user">
                  <CustomerSelect
                    {...field}
                    value={(field.value as string) || ''}
                    onChange={(id: string) => field.onChange(id)}
                    disabled={isPending}
                  />
                </ActionGuard>
              </FormControl>
              <FormDescription>{t('user.form.customer_description')}</FormDescription>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="roleId"
            render={({ field }) => {
              const isCreateWithoutCustomer = mode === 'create' && !watchedCustomerId
              const nonSysOnly = watchedCustomerCode && watchedCustomerCode !== 'SYS'
              const allowedNonSys = new Set(['manager', 'user'])
              const isRoleAllowed = (r: { id: string; name: string }) =>
                allowedNonSys.has(r.id.toLowerCase()) || allowedNonSys.has(r.name.toLowerCase())

              // Build allowed options
              const roleOptions = roles.filter((r) => {
                if (nonSysOnly) return isRoleAllowed(r)
                return true
              })

              return (
                <FormItem>
                  <FormLabel>{t('user.field.role')}</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === '__empty' ? '' : v)}
                    defaultValue={field.value}
                    disabled={isPending || isCreateWithoutCustomer}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('placeholder.select_role')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingRoles ? (
                        <SelectItem value="loading" disabled>
                          {t('user.roles.loading')}
                        </SelectItem>
                      ) : roleOptions.length > 0 ? (
                        roleOptions.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="__empty">{t('user.roles.no_roles')}</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('user.form.role_description')}
                    {mode === 'create' && !watchedCustomerId ? (
                      <span className="text-destructive"> - {t('user.form.role_hint')}</span>
                    ) : null}
                  </FormDescription>
                </FormItem>
              )
            }}
          />

          {/* Department selection removed from system user form per request */}
        </div>

        {/* Dynamic Attributes Fields */}
        {attributeSchema && (
          <DynamicAttributesFields
            schema={attributeSchema}
            values={attributes}
            onChange={setAttributes}
            errors={attributeErrors}
            disabled={isPending}
          />
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={Boolean(isPending || blockSaveDueToRoleMismatch)}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? t('user.form.create_user') : t('user.form.update_user')}
          </Button>
          <Button type="button" variant="outline" onClick={onSuccess} disabled={isPending}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
