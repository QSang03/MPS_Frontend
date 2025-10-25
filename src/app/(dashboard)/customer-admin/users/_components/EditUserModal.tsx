'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Loader2, User, Mail, Building, Shield } from 'lucide-react'
import {
  getRolesForClient,
  getDepartmentsForClient,
  updateUserForClient,
} from '@/lib/auth/data-actions'
import type { User as UserType, UserRole, Department } from '@/types/users'
import { toast } from 'sonner'

// Validation schema for editing user
const editUserSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  roleId: z.string().min(1, 'Vai trò là bắt buộc'),
  departmentId: z.string().min(1, 'Phòng ban là bắt buộc'),
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
  const [departments, setDepartments] = useState<Department[]>([])

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      email: '',
      roleId: '',
      departmentId: '',
      customerId: '',
    },
  })

  // Load roles and departments when modal opens
  useEffect(() => {
    if (isOpen) {
      loadRolesAndDepartments()
    }
  }, [isOpen])

  // Update form when user changes
  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email,
        roleId: user.roleId,
        departmentId: user.departmentId,
        customerId: user.customerId || '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadRolesAndDepartments = async () => {
    try {
      const [rolesData, departmentsData] = await Promise.all([
        getRolesForClient(),
        getDepartmentsForClient(),
      ])
      setRoles(rolesData)
      setDepartments(departmentsData)
    } catch (error) {
      console.error('Error loading roles and departments:', error)
      toast.error('Không thể tải danh sách vai trò và phòng ban')
    }
  }

  const onSubmit = async (data: EditUserFormData) => {
    if (!user) return

    setIsLoading(true)
    try {
      // Ensure we send a proper customerId
      let customerIdToSend: string | undefined = data.customerId || undefined
      if (customerIdToSend && customerCodeToId[customerIdToSend]) {
        customerIdToSend = customerCodeToId[customerIdToSend]
      }

      // Update user
      const updatedUser = await updateUserForClient(user.id, {
        email: data.email,
        roleId: data.roleId,
        departmentId: data.departmentId,
        customerId: customerIdToSend,
      })

      toast.success('✅ Cập nhật thông tin người dùng thành công')
      onUserUpdated(updatedUser)
      onClose()
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
      <DialogContent className="max-w-[550px] overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
        {/* Premium Header */}
        <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 p-0">
          {/* Animated background shapes */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 h-40 w-40 translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
          </div>

          <div className="relative px-8 py-6">
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-xl border border-white/30 bg-white/20 p-2.5 backdrop-blur-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <DialogTitle className="text-2xl font-bold text-white">
                Chỉnh sửa người dùng
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm font-medium text-pink-100">
              Cập nhật thông tin và phân quyền cho người dùng
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Form Content */}
        <div className="space-y-5 bg-gradient-to-b from-gray-50 to-white px-8 py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-bold text-gray-800">
                        <Building className="h-4 w-4 text-rose-600" />
                        Phòng ban *
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 rounded-lg border-2 border-gray-200 transition-all focus:border-rose-500 focus:ring-2 focus:ring-rose-200">
                            <SelectValue placeholder="Chọn phòng ban">
                              {field.value && departments.find((d) => d.id === field.value) && (
                                <div className="flex items-center gap-1">
                                  <span>{departments.find((d) => d.id === field.value)?.name}</span>
                                  <span className="text-xs text-gray-500">
                                    ({departments.find((d) => d.id === field.value)?.code})
                                  </span>
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((department) => (
                            <SelectItem key={department.id} value={department.id}>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{department.name}</span>
                                <span className="text-xs text-gray-500">({department.code})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="mt-1 text-xs text-red-600" />
                    </FormItem>
                  )}
                />
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

              {/* Info card */}
              <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4">
                <p className="text-xs text-gray-700">
                  <span className="font-bold text-blue-700">💡 Tip:</span> Các thay đổi sẽ được lưu
                  ngay khi bạn nhấn "Cập nhật".
                </p>
              </div>

              {/* Form Footer */}
              <div className="mt-6 flex gap-3 border-t-2 border-gray-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 rounded-lg border-2 border-gray-300 font-medium transition-all hover:border-gray-400 hover:bg-gray-50"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="min-w-[120px] flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 font-bold text-white shadow-lg transition-all hover:from-purple-700 hover:to-pink-700 hover:shadow-xl disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>💾 Cập nhật</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
