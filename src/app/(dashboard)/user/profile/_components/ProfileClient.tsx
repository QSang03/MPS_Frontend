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
import { useLocale } from '@/components/providers/LocaleProvider'

interface ProfileClientProps {
  initialProfile: UserProfile | null
}

export function ProfileClient({ initialProfile }: ProfileClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile)
  const router = useRouter()
  const { t } = useLocale()

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
          <p className="text-lg text-gray-500">{t('profile.loading')}</p>
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
          <h1 className="bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-700)] bg-clip-text text-4xl font-bold text-transparent">
            {t('page.profile.title')}
          </h1>
          <p className="mt-2 text-gray-500">{t('profile.header.description')}</p>
        </div>
      </div>

      {/* ✅ FINAL: gap-6 + no gap between cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Overview Card - LEFT */}
        <div className="lg:col-span-1">
          <div className="h-full overflow-hidden rounded-3xl border-0 shadow-xl">
            {/* ✅ BỎ rounded-t-3xl - để gradient trải ra không bo tròn phía trên */}
            <CardHeader className="relative overflow-hidden bg-gradient-to-br from-[var(--brand-500)] via-[var(--brand-700)] to-[var(--brand-700)] p-6 text-center">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
              </div>
              <div className="relative">
                <Avatar className="mx-auto h-24 w-24 rounded-full border-4 border-white shadow-lg">
                  <AvatarFallback className="rounded-full bg-gradient-to-br from-[var(--brand-600)] to-[var(--brand-700)] text-2xl font-bold text-white">
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
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--brand-200)] bg-gradient-to-r from-[var(--brand-50)] to-[var(--brand-100)] p-3">
                <Shield className="h-5 w-5 flex-shrink-0 text-black dark:text-white" />
                <div>
                  <p className="text-xs font-bold text-gray-600">{t('profile.level')}</p>
                  <p className="text-sm font-bold text-[var(--brand-700)]">
                    Level {user.role?.level || 0}
                  </p>
                </div>
              </div>

              {/* Department */}
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--brand-200)] bg-gradient-to-r from-[var(--brand-50)] to-[var(--brand-100)] p-3">
                <Building className="h-5 w-5 flex-shrink-0 text-black dark:text-white" />
                <div>
                  <p className="text-xs font-bold text-gray-600">{t('profile.department')}</p>
                  <p className="text-sm font-bold text-[var(--brand-700)]">{departmentName}</p>
                </div>
              </div>

              {/* Created Date */}
              <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-green-100 p-3">
                <Calendar className="h-5 w-5 flex-shrink-0 text-black dark:text-white" />
                <div>
                  <p className="text-xs font-bold text-gray-600">{t('table.created_at')}</p>
                  <p className="text-sm font-bold text-green-700">{createdDate}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="pt-2">
                {isUserActive ? (
                  <Badge className="w-full justify-center rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-100 to-emerald-50 py-2 font-bold text-emerald-700">
                    <CheckCircle2 className="mr-2 h-4 w-4 text-black dark:text-white" />
                    {t('profile.account_active')}
                  </Badge>
                ) : (
                  <Badge className="w-full justify-center rounded-2xl border-2 border-red-300 bg-gradient-to-r from-red-100 to-red-50 py-2 font-bold text-red-700">
                    <AlertCircle className="mr-2 h-4 w-4 text-black dark:text-white" />
                    {t('profile.account_locked')}
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
            <div className="relative overflow-hidden bg-gradient-to-r from-[var(--brand-600)] via-[var(--brand-700)] to-[var(--brand-700)] p-0">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
              </div>
              <div className="relative flex items-center justify-between px-8 py-6">
                <div className="text-white">
                  <CardTitle className="text-2xl font-bold">{t('profile.details.title')}</CardTitle>
                  <CardDescription className="mt-1 text-sm text-pink-100">
                    {t('profile.details.description')}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  className="rounded-xl border-white/30 bg-white/20 font-bold text-white transition-all hover:bg-white/30"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {t('button.edit')}
                </Button>
              </div>
            </div>

            <CardContent className="space-y-6 bg-gradient-to-b from-gray-50 to-white p-8">
              <p className="text-lg text-gray-500">{t('profile.loading')}</p>
              {/* Basic Information */}
              <div>
                <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
                  <User className="h-5 w-5 text-black dark:text-white" />
                  {t('profile.basic.title')}
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-bold text-gray-700">
                      📧 {t('user.email')}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 flex-shrink-0 text-black dark:text-white" />
                      <div className="flex-1 rounded-2xl border-2 border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">
                        {user.email}
                      </div>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-bold text-gray-700">
                      👤 {t('profile.basic.username')}
                    </Label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 flex-shrink-0 text-black dark:text-white" />
                      <div className="flex-1 rounded-2xl border-2 border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">
                        {user.username || user.email || t('profile.not_updated')}
                      </div>
                    </div>
                  </div>

                  {/* Name (attributes.name) */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-bold text-gray-700">
                      📝 {t('profile.basic.name')}
                    </Label>
                    <div className="flex-1 rounded-2xl border-2 border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">
                      {(attributes && (attributes.name as string)) || t('profile.not_updated')}
                    </div>
                  </div>

                  {/* Phone (attributes.phone) */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-bold text-gray-700">
                      📞 {t('profile.basic.phone')}
                    </Label>
                    <div className="flex-1 rounded-2xl border-2 border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">
                      {(attributes && (attributes.phone as string)) || t('profile.not_updated')}
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6 h-1 bg-gradient-to-r from-[var(--brand-200)] to-[var(--brand-200)]" />

              {/* Role Information */}
              <div>
                <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
                  <Shield className="h-5 w-5 text-black dark:text-white" />
                  {t('profile.role.title')}
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Role */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-700">
                      🎭 {t('profile.role')}
                    </Label>
                    <Badge className="w-full justify-center rounded-2xl border-2 border-[var(--brand-200)] bg-gradient-to-r from-[var(--brand-50)] to-[var(--brand-100)] py-2 font-bold text-[var(--brand-700)]">
                      {user.role?.name || 'User'}
                    </Badge>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-700">
                      ✅ {t('profile.status')}
                    </Label>
                    <Badge
                      className={`w-full justify-center rounded-2xl border-2 py-2 font-bold ${
                        isUserActive
                          ? 'border-emerald-300 bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700'
                          : 'border-red-300 bg-gradient-to-r from-red-100 to-red-50 text-red-700'
                      }`}
                    >
                      {isUserActive ? t('profile.status.active') : t('profile.status.inactive')}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Security Card */}
              <div className="border-gradient-to-r mt-6 rounded-2xl border-2 bg-gradient-to-r from-orange-50 from-orange-200 to-red-50 to-red-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex flex-1 items-start gap-3">
                    <Lock className="mt-1 h-5 w-5 flex-shrink-0 text-black dark:text-white" />
                    <div>
                      <h5 className="flex items-center gap-2 font-bold text-gray-800">
                        🔒 {t('profile.security.title')}
                      </h5>
                      <p className="mt-1 text-sm text-gray-600">
                        {t('profile.security.description')}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      router.push(`${ROUTES.USER_SETTINGS}?tab=password`)
                    }}
                    className="rounded-xl bg-gradient-to-r from-red-600 to-orange-600 font-bold whitespace-nowrap text-white shadow-lg transition-all hover:from-red-700 hover:to-orange-700 hover:shadow-xl"
                  >
                    {t('profile.security.change_password')}
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
