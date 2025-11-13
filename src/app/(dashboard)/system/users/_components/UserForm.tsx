'use client'

import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
import { userSchema, type UserFormData } from '@/lib/validations/user.schema'
import removeEmpty from '@/lib/utils/clean'
import { getRolesForClient, getDepartmentsForClient } from '@/lib/auth/data-actions'
import { usersClientService } from '@/lib/api/services/users-client.service' // Thay đổi ở đây
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

  // Fetch roles and departments
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: getRolesForClient,
  })

  const { data: departments = [], isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartmentsForClient,
  })

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: initialData?.email || '',
      fullName: initialData?.fullName || '',
      customerId: initialData?.customerId || customerId || '',
      roleId: initialData?.roleId || '',
      departmentId: initialData?.departmentId || '',
    },
  })

  // Helper type for dynamic form field names returned by the server
  type FormFieldName = Parameters<typeof form.setError>[0]

  const [serverError, setServerError] = useState<string | null>(null)

  // Sử dụng usersClientService thay vì Server Action
  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => usersClientService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Tạo người dùng thành công!')
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
        (error instanceof Error ? error.message : 'Tạo người dùng thất bại')
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

  // Sử dụng usersClientService thay vì Server Action
  const updateMutation = useMutation({
    mutationFn: (data: UserFormData) => usersClientService.updateUser(initialData!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Cập nhật người dùng thành công!')
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
        _backend.message ||
        (error instanceof Error ? error.message : 'Cập nhật người dùng thất bại')
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
    // Don't send password from client; let backend generate a default password when creating
    // Remove empty fields so backend won't receive blank strings
    const payload = removeEmpty(data as unknown as Record<string, unknown>)

    if (mode === 'create') {
      createMutation.mutate(payload as UserFormData)
    } else {
      updateMutation.mutate(payload as UserFormData)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Top-level error summary (show server/general + field errors) */}
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
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormDescription>Địa chỉ email của người dùng</FormDescription>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Họ tên</FormLabel>
              <FormControl>
                <Input placeholder="Nhập họ tên đầy đủ" {...field} disabled={isPending} />
              </FormControl>
              <FormDescription>Họ tên đầy đủ của người dùng</FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Khách hàng</FormLabel>
              <FormControl>
                <CustomerSelect
                  {...field}
                  value={(field.value as string) || ''}
                  onChange={(id: string) => field.onChange(id)}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>Khách hàng mà tài khoản thuộc về (tùy chọn)</FormDescription>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="roleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vai trò</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingRoles ? (
                      <SelectItem value="loading" disabled>
                        Đang tải vai trò...
                      </SelectItem>
                    ) : roles.length > 0 ? (
                      roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="">Không có vai trò</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>Vai trò của người dùng trong hệ thống</FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phòng ban</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isPending || isLoadingDepartments}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phòng ban" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingDepartments ? (
                      <SelectItem value="loading" disabled>
                        Đang tải phòng ban...
                      </SelectItem>
                    ) : departments.length > 0 ? (
                      departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        Không có phòng ban
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>Phòng ban của người dùng (tùy chọn)</FormDescription>
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Tạo người dùng' : 'Cập nhật người dùng'}
          </Button>
          <Button type="button" variant="outline" onClick={onSuccess} disabled={isPending}>
            Hủy
          </Button>
        </div>
      </form>
    </Form>
  )
}
