'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
})

type EditUserFormData = z.infer<typeof editUserSchema>

interface EditUserModalProps {
  user: UserType | null
  isOpen: boolean
  onClose: () => void
  onUserUpdated: (updatedUser: UserType) => void
}

export function EditUserModal({ user, isOpen, onClose, onUserUpdated }: EditUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<UserRole[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      email: '',
      roleId: '',
      departmentId: '',
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
      })
    }
  }, [user, form])

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
      const updatedUser = await updateUserForClient(user.id, {
        email: data.email,
        roleId: data.roleId,
        departmentId: data.departmentId,
      })

      toast.success('Cập nhật thông tin người dùng thành công')
      onUserUpdated(updatedUser)
      onClose()
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Có lỗi xảy ra khi cập nhật thông tin người dùng')
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Chỉnh sửa thông tin người dùng
          </DialogTitle>
          <DialogDescription>Cập nhật thông tin và phân quyền cho người dùng</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập email người dùng" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role Field */}
            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Vai trò
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn vai trò" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          <div className="flex w-full items-center justify-between">
                            <span>{role.name}</span>
                            <span className="text-muted-foreground ml-2 text-sm">
                              Level {role.level}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Department Field */}
            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Phòng ban
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn phòng ban">
                          {field.value && departments.find((d) => d.id === field.value) && (
                            <div className="flex items-center gap-2">
                              <span>{departments.find((d) => d.id === field.value)?.name}</span>
                              <span className="text-muted-foreground text-sm">
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
                          <div className="flex flex-row items-center gap-2">
                            <span>{department.name}</span>
                            <span className="text-muted-foreground text-sm">
                              ({department.code})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cập nhật
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
