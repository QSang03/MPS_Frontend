'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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
import { useLocale } from '@/components/providers/LocaleProvider'
import { useActionPermission } from '@/lib/hooks/useActionPermission'

// moved into component to allow translated messages

type EditUserFormData = {
  email: string
  roleId: string
  customerId?: string
  departmentId?: string
}

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
  const { can } = useActionPermission('users')
  const canUpdateUser = can('update')
  const canReadRoles = can('filter-by-role')

  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<UserRole[]>([])

  const [attributes, setAttributes] = useState<Record<string, unknown>>(user?.attributes || {})
  const [, setAttributeErrors] = useState<Record<string, string>>({})
  const { t } = useLocale()

  const editUserSchema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .min(1, t('validation.email_required'))
          .email(t('validation.email_invalid')),
        roleId: z.string().min(1, t('validation.role_required')),
        customerId: z.string().optional(),
        departmentId: z.string().optional(),
      }),
    [t]
  )

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
  }, [user, form])

  // load roles when modal opens
  const loadRoles = useCallback(async () => {
    try {
      const rolesData = await getRolesForClient()
      setRoles(rolesData)
    } catch (error) {
      console.error('Error loading roles:', error)
      toast.error(t('error.loading_roles'))
    }
  }, [t])

  useEffect(() => {
    if (isOpen && canUpdateUser && canReadRoles) loadRoles()
  }, [isOpen, loadRoles, canUpdateUser, canReadRoles])

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

    if (!canUpdateUser) {
      toast.error(t('common.no_permission'))
      return
    }

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
          toast.error(t('error.check_attributes'))
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

      toast.success(t('user.update_success'))
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
        (error instanceof Error ? error.message : t('user.update_error'))

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
            toast.error(t('validation.fields_error'))
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
            toast.error(t('validation.fields_error'))
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
          toast.error(t('validation.fields_error'))
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
          toast.error(t('validation.fields_error'))
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
              disabled={isLoading}
              className="min-w-[120px] bg-gradient-to-r from-orange-600 to-amber-400 hover:from-orange-700 hover:to-amber-500"
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
                      {t('user.email')} <span className="text-muted-foreground">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder={t('user.email_placeholder')} type="email" {...field} />
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
                        {t('user.customer_code')}
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('filters.select_customer_placeholder')}>
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
              <div className="rounded-lg border border-[var(--brand-200)] bg-[var(--brand-50)] p-4">
                <p className="text-xs text-[var(--brand-700)]">
                  <span className="font-bold">💡 {t('hint')}:</span> {t('user.update_tip')}
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
