'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Edit,
  Mail,
  Shield,
  User,
  Calendar,
  Building,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import type { UserProfile } from '@/types/auth'
import { getUserProfileForClient } from '@/lib/auth/server-actions'
import { EditProfileModal } from './EditProfileModal'

interface ProfileClientProps {
  initialProfile: UserProfile | null
}

export function ProfileClient({ initialProfile }: ProfileClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile)
  const router = useRouter()

  useEffect(() => {
    if (!profile) {
      ;(async () => {
        try {
          const p = await getUserProfileForClient()
          if (!p) {
            router.push('/auth/login')
            return
          }
          setProfile(p)
        } catch (err) {
          console.error('Failed to fetch profile in client:', err)
          router.push('/auth/login')
        }
      })()
    }
  }, [profile, router])

  if (!profile) {
    return (
      <Card className="rounded-3xl border-2 border-gray-200">
        <CardContent className="p-8 text-center">
          <p className="text-lg text-gray-500">⏳ Đang tải thông tin hồ sơ...</p>
        </CardContent>
      </Card>
    )
  }

  const { user } = profile

  // Get initials for avatar
  const initials = user.email?.split('@')[0]?.slice(0, 2)?.toUpperCase() || 'U'

  // ✅ FIX: Safely parse createdAt date (handle undefined)
  const createdDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('vi-VN')
    : new Date().toLocaleDateString('vi-VN')

  // ✅ FIX: Access department from role or attributes (attributes values are unknown)
  const attributes = user.attributes as Record<string, unknown> | undefined
  const deptFromAttr =
    typeof attributes?.departmentName === 'string' ? attributes.departmentName : undefined
  const departmentName = deptFromAttr || user.role?.departmentId || 'N/A'

  // ✅ FIX: Check isActive - prefer role.isActive, then attributes.isActive if boolean, else default true
  const isUserActive =
    typeof user.role?.isActive === 'boolean'
      ? user.role!.isActive
      : typeof attributes?.isActive === 'boolean'
        ? Boolean(attributes.isActive)
        : true

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-4xl font-bold text-transparent">
            👤 Hồ sơ cá nhân
          </h1>
          <p className="mt-2 text-gray-500">Quản lý thông tin tài khoản và bảo mật</p>
        </div>
      </div>

      {/* ✅ FINAL: gap-6 + no gap between cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Overview Card - LEFT */}
        <div className="lg:col-span-1">
          <div className="h-full overflow-hidden rounded-3xl border-0 shadow-xl">
            {/* ✅ BỎ rounded-t-3xl - để gradient trải ra không bo tròn phía trên */}
            <CardHeader className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 p-6 text-center">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
              </div>
              <div className="relative">
                <Avatar className="mx-auto h-24 w-24 rounded-full border-4 border-white shadow-lg">
                  <AvatarFallback className="rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-2xl font-bold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="mt-4 text-xl font-bold text-white">{user.email}</CardTitle>
                <CardDescription className="mt-2">
                  <Badge className="rounded-xl border-white/30 bg-white/20 font-bold text-white">
                    {user.role?.name || 'User'}
                  </Badge>
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 bg-gradient-to-b from-gray-50 to-white p-6">
              {/* Role Level */}
              <div className="flex items-center gap-3 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100 p-3">
                <Shield className="h-5 w-5 flex-shrink-0 text-purple-600" />
                <div>
                  <p className="text-xs font-bold text-gray-600">CẤP ĐỘ</p>
                  <p className="text-sm font-bold text-purple-700">Level {user.role?.level || 0}</p>
                </div>
              </div>

              {/* Department */}
              <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 p-3">
                <Building className="h-5 w-5 flex-shrink-0 text-blue-600" />
                <div>
                  <p className="text-xs font-bold text-gray-600">BỘ PHẬN</p>
                  <p className="text-sm font-bold text-blue-700">{departmentName}</p>
                </div>
              </div>

              {/* Created Date */}
              <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-green-100 p-3">
                <Calendar className="h-5 w-5 flex-shrink-0 text-green-600" />
                <div>
                  <p className="text-xs font-bold text-gray-600">NGÀY TẠO</p>
                  <p className="text-sm font-bold text-green-700">{createdDate}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="pt-2">
                {isUserActive ? (
                  <Badge className="w-full justify-center rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-100 to-emerald-50 py-2 font-bold text-emerald-700">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Tài khoản hoạt động
                  </Badge>
                ) : (
                  <Badge className="w-full justify-center rounded-2xl border-2 border-red-300 bg-gradient-to-r from-red-100 to-red-50 py-2 font-bold text-red-700">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Tài khoản bị khóa
                  </Badge>
                )}
              </div>
            </CardContent>
          </div>
        </div>

        {/* Profile Details Card - RIGHT */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-3xl border-0 shadow-xl">
            {/* ✅ BỎ rounded-t-3xl - để gradient trải ra không bo tròn phía trên */}
            <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 p-0">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
              </div>
              <div className="relative flex items-center justify-between px-8 py-6">
                <div className="text-white">
                  <CardTitle className="text-2xl font-bold">📋 Thông tin chi tiết</CardTitle>
                  <CardDescription className="mt-1 text-sm text-pink-100">
                    Cập nhật hồ sơ cá nhân của bạn
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  className="rounded-xl border-white/30 bg-white/20 font-bold text-white transition-all hover:bg-white/30"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  ✏️ Chỉnh sửa
                </Button>
              </div>
            </div>

            <CardContent className="space-y-6 bg-gradient-to-b from-gray-50 to-white p-8">
              {/* Basic Information */}
              <div>
                <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
                  <User className="h-5 w-5 text-purple-600" />
                  Thông tin cơ bản
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-bold text-gray-700">
                      📧 Email
                    </Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 flex-shrink-0 text-gray-400" />
                      <div className="flex-1 rounded-2xl border-2 border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">
                        {user.email}
                      </div>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-bold text-gray-700">
                      👤 Tên đăng nhập
                    </Label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 flex-shrink-0 text-gray-400" />
                      <div className="flex-1 rounded-2xl border-2 border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">
                        {user.username || user.email || 'Chưa cập nhật'}
                      </div>
                    </div>
                  </div>

                  {/* First Name */}
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-bold text-gray-700">
                      📝 Tên
                    </Label>
                    <div className="flex-1 rounded-2xl border-2 border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">
                      {user.firstName || 'Chưa cập nhật'}
                    </div>
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-bold text-gray-700">
                      📝 Họ
                    </Label>
                    <div className="flex-1 rounded-2xl border-2 border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">
                      {user.lastName || 'Chưa cập nhật'}
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6 h-1 bg-gradient-to-r from-purple-200 to-pink-200" />

              {/* Role Information */}
              <div>
                <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
                  <Shield className="h-5 w-5 text-pink-600" />
                  Thông tin vai trò
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Role */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-700">🎭 Vai trò</Label>
                    <Badge className="w-full justify-center rounded-2xl border-2 border-blue-300 bg-gradient-to-r from-blue-100 to-blue-50 py-2 font-bold text-blue-700">
                      {user.role?.name || 'User'}
                    </Badge>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-700">✅ Trạng thái</Label>
                    <Badge
                      className={`w-full justify-center rounded-2xl border-2 py-2 font-bold ${
                        isUserActive
                          ? 'border-emerald-300 bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700'
                          : 'border-red-300 bg-gradient-to-r from-red-100 to-red-50 text-red-700'
                      }`}
                    >
                      {isUserActive ? '✓ Hoạt động' : '✗ Không hoạt động'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Security Card */}
              <div className="border-gradient-to-r mt-6 rounded-2xl border-2 bg-gradient-to-r from-orange-50 from-orange-200 to-red-50 to-red-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex flex-1 items-start gap-3">
                    <Lock className="mt-1 h-5 w-5 flex-shrink-0 text-red-600" />
                    <div>
                      <h5 className="flex items-center gap-2 font-bold text-gray-800">
                        🔒 Bảo mật tài khoản
                      </h5>
                      <p className="mt-1 text-sm text-gray-600">
                        Thay đổi mật khẩu và cài đặt bảo mật của bạn
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      router.push(`${ROUTES.USER_SETTINGS}?tab=password`)
                    }}
                    className="rounded-xl bg-gradient-to-r from-red-600 to-orange-600 font-bold whitespace-nowrap text-white shadow-lg transition-all hover:from-red-700 hover:to-orange-700 hover:shadow-xl"
                  >
                    🔐 Đổi mật khẩu
                  </Button>
                </div>
              </div>
            </CardContent>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        profile={profile}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProfileUpdated={(updatedProfile) => {
          setProfile(updatedProfile)
          setIsModalOpen(false)
        }}
      />
    </div>
  )
}
