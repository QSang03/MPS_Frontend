'use client'

import { useForm, useWatch } from 'react-hook-form'
import { useState, useMemo, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
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
import { DynamicAttributesFields } from '@/components/shared/DynamicAttributesFields'
import { rolesClientService } from '@/lib/api/services/roles-client.service'
import { userSchema, type UserFormData } from '@/lib/validations/user.schema'
import removeEmpty from '@/lib/utils/clean'
import { usersClientService } from '@/lib/api/services/users-client.service'
import { useRoleAttributeSchema } from '@/lib/hooks/useRoleAttributeSchema'
import type { User, UserRole } from '@/types/users'
import { useActionPermission } from '@/lib/hooks/useActionPermission'

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

  const { can } = useActionPermission('users')
  const canCreate = can('create')
  const canUpdate = can('update')
  const canSubmit = mode === 'create' ? canCreate : canUpdate

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: initialData?.email || '',
      fullName: initialData?.fullName || '',
      phone: (initialData?.attributes as Record<string, any>)?.phone || initialData?.phone || '',
      roleAttribute: (initialData?.attributes as Record<string, any>)?.role || '',
      customerId: initialData?.customerId || customerId || '',
      roleId: initialData?.roleId || '',
    },
  })

  type FormFieldName = Parameters<typeof form.setError>[0]

  const [serverError, setServerError] = useState<string | null>(null)

  // Dynamic attributes state
  const [attributes, setAttributes] = useState<Record<string, unknown>>(
    initialData?.attributes || {}
  )
  const [attributeErrors, setAttributeErrors] = useState<Record<string, string>>({})

  // Load roles for role select
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await rolesClientService.getRoles({ page: 1, limit: 100 })).data,
    enabled: canSubmit,
  })

  // Watch selected role to get its schema (use useWatch to avoid incompatible-library warning)
  const selectedRoleId = useWatch({ control: form.control, name: 'roleId' })
  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId),
    [roles, selectedRoleId]
  )

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

  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => usersClientService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(t('user.create_success'))
      form.reset()
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/user/users')
      }
    },
    onError: (error: unknown) => {
      const resp = (error as { response?: { data?: unknown } })?.response?.data
      const _backend = resp as {
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
      const errorFields: string[] = []
      if (Array.isArray(details?.errors) && details.errors.length > 0) {
        for (const e of details.errors) {
          if (e?.field) {
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

      const first = errorFields[0]
      if (first) {
        try {
          if (typeof form.setFocus === 'function') {
            setTimeout(() => {
              ;(form.setFocus as (name: string) => void)(first)
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

  const updateMutation = useMutation({
    mutationFn: (data: UserFormData) => usersClientService.updateUser(initialData!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(t('user.update_success'))
      form.reset()
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/user/users')
      }
    },
    onError: (error: unknown) => {
      const resp = (error as { response?: { data?: unknown } })?.response?.data
      const _backend = resp as {
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
              ;(form.setFocus as (name: string) => void)(first)
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
    if (!canSubmit) {
      toast.error(t('common.no_permission'))
      return
    }
    // Validate attributes if schema exists
    if (attributeSchema) {
      const validation = validateAttributes(attributes)
      if (!validation.valid) {
        setAttributeErrors(validation.errors)
        toast.error(t('error.check_attributes'))
        return
      }
      setAttributeErrors({})
    }

    const payload = removeEmpty({
      ...data,
      fullName: data.fullName, // Map fullName to name
      attributes: {
        ...(attributeSchema ? attributes : {}),
        role: data.roleAttribute,
        phone: data.phone,
      },
      phone: undefined,
      roleAttribute: undefined,
    } as unknown as Record<string, unknown>)

    if (mode === 'create') {
      createMutation.mutate(payload as UserFormData)
    } else {
      updateMutation.mutate(payload as UserFormData)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const isDisabled = isPending || !canSubmit

  if (!canSubmit) {
    return (
      <div className="rounded-md border p-4 text-sm">
        <div className="font-medium">{t('error.forbidden.title')}</div>
        <div className="text-muted-foreground mt-1">{t('error.forbidden.description')}</div>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {serverError || Object.keys(form.formState.errors).length > 0 ? (
          <div className="border-destructive/60 bg-destructive/10 text-destructive rounded border-2 p-3 text-sm">
            {serverError && <div className="mb-1 font-medium">{serverError}</div>}
            <ul className="list-disc pl-5">
              {Object.entries(form.formState.errors).map(([k, v]) => (
                <li key={k}>{String(v?.message ?? k)}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('user.email')}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t('user.email_placeholder')}
                    {...field}
                    disabled={isDisabled}
                  />
                </FormControl>
                <FormDescription>{t('user.field.email_description')}</FormDescription>
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
                    disabled={isDisabled}
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
                <FormLabel>{t('user.field.fullName')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('user.placeholder.fullName')}
                    {...field}
                    disabled={isDisabled}
                  />
                </FormControl>
                <FormDescription>{t('user.field.fullName_description')}</FormDescription>
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
                    disabled={isDisabled}
                  />
                </FormControl>
                <FormDescription>{t('user.field.role_attribute_description')}</FormDescription>
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="roleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('user.field.role')}</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={(field.value as string) || ''}>
                  <SelectTrigger className="h-10 rounded-lg border-2 border-gray-200 transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-200">
                    <SelectValue placeholder={t('placeholder.select_role')} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingRoles ? (
                      <SelectItem value="__loading" disabled>
                        {t('user.roles.loading')}
                      </SelectItem>
                    ) : roles.length === 0 ? (
                      <SelectItem value="__no_roles" disabled>
                        {t('user.roles.no_roles')}
                      </SelectItem>
                    ) : (
                      roles.map((r: UserRole) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>{t('user.field.role_description')}</FormDescription>
            </FormItem>
          )}
        />

        {/* Dynamic Attributes Fields */}
        {attributeSchema && (
          <DynamicAttributesFields
            schema={attributeSchema}
            values={attributes}
            onChange={setAttributes}
            errors={attributeErrors}
            disabled={isDisabled}
          />
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={isDisabled}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? t('user.button.create') : t('button.update')}
          </Button>
          <Button type="button" variant="outline" onClick={onSuccess} disabled={isDisabled}>
            {t('cancel')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
