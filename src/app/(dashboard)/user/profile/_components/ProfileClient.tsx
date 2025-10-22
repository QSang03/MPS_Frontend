'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Edit, Mail, Shield, User, Calendar, Building } from 'lucide-react'
import type { UserProfile } from '@/types/auth'

interface ProfileClientProps {
  initialProfile: UserProfile | null
}

export function ProfileClient({ initialProfile }: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [profile] = useState(initialProfile)
  const router = useRouter()

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Không thể tải thông tin hồ sơ</p>
        </CardContent>
      </Card>
    )
  }

  const { user } = profile

  // Get initials for avatar
  const initials = user.email?.split('@')[0]?.slice(0, 2)?.toUpperCase() || 'U'

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Profile Overview */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader className="text-center">
            <Avatar className="mx-auto h-24 w-24">
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl">{user.email}</CardTitle>
            <CardDescription>
              <Badge variant="secondary" className="mt-2">
                {user.role.name}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-muted-foreground flex items-center space-x-2 text-sm">
              <Shield className="h-4 w-4" />
              <span>Cấp độ: {user.role.level}</span>
            </div>
            <div className="text-muted-foreground flex items-center space-x-2 text-sm">
              <Building className="h-4 w-4" />
              <span>Department: {user.role.departmentId}</span>
            </div>
            <div className="text-muted-foreground flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span>Tạo: {new Date(user.role.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Details */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Thông tin chi tiết</CardTitle>
              <CardDescription>{user.role.description}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
              <Edit className="mr-2 h-4 w-4" />
              {isEditing ? 'Hủy' : 'Chỉnh sửa'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center space-x-2">
                  <Mail className="text-muted-foreground h-4 w-4" />
                  <Input id="email" value={user.email} disabled={!isEditing} className="bg-muted" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <div className="flex items-center space-x-2">
                  <User className="text-muted-foreground h-4 w-4" />
                  <Input
                    id="username"
                    value={user.username || user.email}
                    disabled={!isEditing}
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstName">Tên</Label>
                <Input
                  id="firstName"
                  value={user.firstName || ''}
                  disabled={!isEditing}
                  placeholder="Chưa cập nhật"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Họ</Label>
                <Input
                  id="lastName"
                  value={user.lastName || ''}
                  disabled={!isEditing}
                  placeholder="Chưa cập nhật"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Thông tin vai trò</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Vai trò</Label>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{user.role.name}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <div className="flex items-center space-x-2">
                    <Badge variant={user.role.isActive ? 'default' : 'secondary'}>
                      {user.role.isActive ? 'Hoạt động' : 'Không hoạt động'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Hủy
                </Button>
                <Button
                  onClick={() => {
                    // TODO: Implement update profile
                    setIsEditing(false)
                  }}
                >
                  Lưu thay đổi
                </Button>
              </div>
            )}

            {!isEditing && (
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Bảo mật</CardTitle>
                    <CardDescription>
                      Thao tác liên quan tới mật khẩu và bảo mật tài khoản
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        router.push(`${ROUTES.USER_SETTINGS}?tab=password`)
                      }}
                    >
                      Đổi mật khẩu
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
