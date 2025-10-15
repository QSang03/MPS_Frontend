'use client'

import { useForm } from 'react-hook-form'
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
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { userSchema, type UserFormData } from '@/lib/validations/user.schema'
import {
  getRolesForClient,
  getDepartmentsForClient,
  createUserForClient,
  updateUserForClient,
} from '@/lib/auth/data-actions'
import type { User } from '@/types/users'

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
      username: initialData?.username || '',
      email: initialData?.email || '',
      fullName: initialData?.fullName || '',
      roleId: initialData?.roleId || '',
      departmentId: initialData?.departmentId || '',
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
      phoneNumber: initialData?.phoneNumber || '',
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: UserFormData) =>
      createUserForClient({ ...(data as Partial<User>), customerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Tạo người dùng thành công!')
      form.reset()
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/customer-admin/users')
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Tạo người dùng thất bại'
      toast.error(message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: UserFormData) => updateUserForClient(initialData!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Cập nhật người dùng thành công!')
      form.reset()
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/customer-admin/users')
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Cập nhật người dùng thất bại'
      toast.error(message)
    },
  })

  const onSubmit = (data: UserFormData) => {
    if (mode === 'create') {
      createMutation.mutate({
        ...data,
        password: 'Ainkczalov2!', // Default password - user should change on first login
      } as UserFormData & { password: string })
    } else {
      updateMutation.mutate(data)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên đăng nhập</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nhập tên đăng nhập"
                    {...field}
                    disabled={isPending}
                    className="font-mono"
                  />
                </FormControl>
                <FormDescription>Tên đăng nhập duy nhất</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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
                <FormMessage />
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
              <FormMessage />
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
                <FormMessage />
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Số điện thoại</FormLabel>
              <FormControl>
                <Input placeholder="0123456789" {...field} disabled={isPending} />
              </FormControl>
              <FormDescription>Số điện thoại liên hệ (tùy chọn)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Trạng thái hoạt động</FormLabel>
                <FormDescription>Cho phép người dùng đăng nhập và sử dụng hệ thống</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isPending}
                />
              </FormControl>
            </FormItem>
          )}
        />

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
