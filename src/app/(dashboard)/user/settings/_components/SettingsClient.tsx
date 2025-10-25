'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { changePasswordForClient } from '@/lib/auth/server-actions'
import { getUserProfileForClient } from '@/lib/auth/server-actions'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Key, User, Mail, Bell, Save, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import type { UserProfile } from '@/types/auth'

interface SettingsClientProps {
  initialProfile: UserProfile | null
  initialTab?: 'account' | 'password' | 'notifications'
}

export function SettingsClient({ initialProfile, initialTab = 'account' }: SettingsClientProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [activeTab, setActiveTab] = useState<'account' | 'password' | 'notifications'>(initialTab)

  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    try {
      const tab = searchParams?.get('tab') as 'account' | 'password' | 'notifications' | null
      if (tab) {
        setActiveTab(tab)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!profile) {
      ;(async () => {
        try {
          setIsFetchingProfile(true)
          const p = await getUserProfileForClient()
          if (!p) {
            router.push('/auth/login')
            return
          }
          setProfile(p)
        } catch (err) {
          console.error('Failed to fetch profile in settings client:', err)
          router.push('/auth/login')
        } finally {
          setIsFetchingProfile(false)
        }
      })()
    }
  }, [])

  // Form states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')

  // Password states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Notification states
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [loginAlerts, setLoginAlerts] = useState(true)
  const [systemUpdates, setSystemUpdates] = useState(false)
  const [marketingEmails, setMarketingEmails] = useState(false)

  // UI states
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null)
  const [isFetchingProfile, setIsFetchingProfile] = useState<boolean>(!initialProfile)
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null)
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setFirstName(profile.user.firstName || '')
      setLastName(profile.user.lastName || '')
      setUsername(profile.user.username || '')
    }
  }, [profile])

  if (!profile) {
    return (
      <Card className="rounded-3xl border-2 border-gray-200">
        <CardContent className="p-8 text-center">
          <p className="text-lg text-gray-500">
            {isFetchingProfile
              ? '⏳ Đang tải thông tin cài đặt...'
              : '❌ Không thể tải thông tin cài đặt'}
          </p>
        </CardContent>
      </Card>
    )
  }

  const handleSaveAccount = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setMessage({ success: true, text: '✅ Cập nhật thông tin thành công!' })
    } catch {
      setMessage({ success: false, text: '❌ Có lỗi xảy ra khi cập nhật thông tin' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    setCurrentPasswordError(null)
    setNewPasswordError(null)
    setConfirmPasswordError(null)
    setMessage(null)

    let hasError = false

    if (!currentPassword) {
      setCurrentPasswordError('Mật khẩu hiện tại là bắt buộc')
      hasError = true
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Mật khẩu xác nhận không khớp')
      hasError = true
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(newPassword)) {
      setNewPasswordError(
        'Mật khẩu mới phải có ít nhất 8 ký tự, chứa 1 chữ thường, 1 chữ hoa và 1 số'
      )
      hasError = true
    }

    if (currentPassword && currentPassword === newPassword) {
      setNewPasswordError('Mật khẩu mới không được giống mật khẩu hiện tại')
      hasError = true
    }

    if (hasError) return

    setIsLoading(true)

    try {
      const res = await changePasswordForClient({ currentPassword, newPassword })

      const isObj = (v: unknown): v is Record<string, unknown> =>
        typeof v === 'object' && v !== null

      if (isObj(res)) {
        if ((res as Record<string, unknown>).authExpired === true) {
          router.push('/auth/login')
          return
        }
        const hasSuccess = Object.prototype.hasOwnProperty.call(res, 'success')
        const payload = res as Record<string, unknown>

        if (hasSuccess) {
          if (payload.success === true) {
            setMessage({
              success: true,
              text: String(payload.message || '✅ Đổi mật khẩu thành công!'),
            })
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
          } else {
            const errors = payload.errors as Record<string, unknown> | undefined
            if (errors && typeof errors === 'object') {
              if (errors.currentPassword) setCurrentPasswordError(String(errors.currentPassword))
              if (errors.newPassword) setNewPasswordError(String(errors.newPassword))
              if (errors.confirmPassword) setConfirmPasswordError(String(errors.confirmPassword))
              if (payload.message) setMessage({ success: false, text: String(payload.message) })
            } else {
              const errText = String(payload.error || payload.message || 'Đổi mật khẩu thất bại')
              const lower = errText.toLowerCase()
              if (
                lower.includes('current') ||
                lower.includes('hiện tại') ||
                lower.includes('incorrect')
              ) {
                setCurrentPasswordError(errText)
              } else if (lower.includes('confirm') || lower.includes('xác nhận')) {
                setConfirmPasswordError(errText)
              } else if (lower.includes('new') || lower.includes('mới')) {
                setNewPasswordError(errText)
              } else {
                setMessage({ success: false, text: errText })
              }
            }
          }
        } else {
          const errors = payload.errors as Record<string, unknown> | undefined
          if (errors && typeof errors === 'object') {
            if (errors.currentPassword) setCurrentPasswordError(String(errors.currentPassword))
            if (errors.newPassword) setNewPasswordError(String(errors.newPassword))
            if (errors.confirmPassword) setConfirmPasswordError(String(errors.confirmPassword))
            if (payload.message) setMessage({ success: false, text: String(payload.message) })
          } else if (payload.error) {
            const lower = String(payload.error).toLowerCase()
            if (
              lower.includes('current') ||
              lower.includes('hiện tại') ||
              lower.includes('incorrect')
            ) {
              setCurrentPasswordError(String(payload.error))
            } else if (lower.includes('confirm') || lower.includes('xác nhận')) {
              setConfirmPasswordError(String(payload.error))
            } else if (lower.includes('new') || lower.includes('mới')) {
              setNewPasswordError(String(payload.error))
            } else {
              setMessage({ success: false, text: String(payload.error) })
            }
          } else {
            setMessage({
              success: true,
              text: String(payload.message || '✅ Đổi mật khẩu thành công!'),
            })
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
          }
        }
      } else {
        setMessage({ success: true, text: '✅ Đổi mật khẩu thành công!' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setMessage({ success: false, text: '❌ Có lỗi xảy ra khi đổi mật khẩu' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setMessage({ success: true, text: '✅ Lưu cài đặt thông báo thành công!' })
    } catch {
      setMessage({ success: false, text: '❌ Có lỗi xảy ra khi lưu cài đặt' })
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'account', label: 'Tài khoản', icon: User },
    { id: 'password', label: 'Mật khẩu', icon: Key },
    { id: 'notifications', label: 'Thông báo', icon: Bell },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}

      {/* Message Alert */}
      {message && (
        <Alert
          variant={message.success ? 'default' : 'destructive'}
          className={`rounded-2xl border-2 ${
            message.success
              ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-800'
              : 'border-red-300 bg-gradient-to-r from-red-50 to-red-100 text-red-800'
          }`}
        >
          {message.success ? (
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <AlertDescription className="font-semibold">{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Tab Navigation - Premium */}
      <div className="border-b-2 border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'account' | 'password' | 'notifications')}
                className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-purple-500'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Account Settings */}
        {activeTab === 'account' && (
          <div className="overflow-hidden rounded-3xl border-0 shadow-xl">
            <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 p-0">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 h-40 w-40 translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
              </div>
              <div className="relative px-8 py-6">
                <CardTitle className="flex items-center gap-2 text-2xl font-bold text-white">
                  <User className="h-6 w-6" />
                  👤 Thông tin tài khoản
                </CardTitle>
                <CardDescription className="mt-2 text-sm text-pink-100">
                  Cập nhật thông tin cá nhân của bạn
                </CardDescription>
              </div>
            </div>
            <CardContent className="space-y-6 bg-gradient-to-b from-gray-50 to-white p-8">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-bold text-gray-700">
                    📧 Email
                  </Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      value={profile.user.email}
                      disabled
                      className="rounded-2xl border-2 border-gray-200 bg-gray-50"
                    />
                  </div>
                  <p className="text-xs text-gray-500">💡 Email không thể thay đổi</p>
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-bold text-gray-700">
                    👤 Tên đăng nhập
                  </Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập"
                    className="rounded-2xl border-2 border-gray-200 transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  />
                </div>

                {/* First Name */}
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-bold text-gray-700">
                    📝 Tên
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Nhập tên"
                    className="rounded-2xl border-2 border-gray-200 transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-bold text-gray-700">
                    📝 Họ
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Nhập họ"
                    className="rounded-2xl border-2 border-gray-200 transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  />
                </div>
              </div>

              <Separator className="my-6 h-1 bg-gradient-to-r from-purple-200 to-pink-200" />

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveAccount}
                  disabled={isLoading}
                  className="rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 font-bold text-white shadow-lg transition-all hover:from-purple-700 hover:to-pink-700 hover:shadow-xl"
                >
                  <Save className="mr-2 h-5 w-5" />
                  {isLoading ? '⏳ Đang lưu...' : ' Lưu thay đổi'}
                </Button>
              </div>
            </CardContent>
          </div>
        )}

        {/* Password Settings */}
        {activeTab === 'password' && (
          <div className="overflow-hidden rounded-3xl border-0 shadow-xl">
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-0">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
              </div>
              <div className="relative px-8 py-6">
                <CardTitle className="flex items-center gap-2 text-2xl font-bold text-white">
                  <Key className="h-6 w-6" />
                  🔐 Đổi mật khẩu
                </CardTitle>
                <CardDescription className="mt-2 text-sm text-cyan-100">
                  Thay đổi mật khẩu để bảo mật tài khoản
                </CardDescription>
              </div>
            </div>
            <CardContent className="space-y-6 bg-gradient-to-b from-gray-50 to-white p-8">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm font-bold text-gray-700">
                  🔑 Mật khẩu hiện tại
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    className={`rounded-2xl border-2 pr-10 transition-all ${
                      currentPasswordError
                        ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
                  />
                  {currentPasswordError && (
                    <p className="mt-1 text-sm font-semibold text-red-600">
                      {currentPasswordError}
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-bold text-gray-700">
                  ✨ Mật khẩu mới
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className={`rounded-2xl border-2 pr-10 transition-all ${
                      newPasswordError
                        ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
                  />
                  {newPasswordError && (
                    <p className="mt-1 text-sm font-semibold text-red-600">{newPasswordError}</p>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-bold text-gray-700">
                  ✅ Xác nhận mật khẩu mới
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className={`rounded-2xl border-2 pr-10 transition-all ${
                      confirmPasswordError
                        ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
                  />
                  {confirmPasswordError && (
                    <p className="mt-1 text-sm font-semibold text-red-600">
                      {confirmPasswordError}
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-4">
                <p className="text-xs text-gray-700">
                  <span className="font-bold text-blue-700">💡 Yêu cầu mật khẩu:</span> Ít nhất 8 ký
                  tự, chứa chữ thường, chữ hoa và số
                </p>
              </div>

              <Separator className="my-6 h-1 bg-gradient-to-r from-blue-200 to-cyan-200" />

              <div className="flex justify-end">
                <Button
                  onClick={handleChangePassword}
                  disabled={isLoading}
                  className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 font-bold text-white shadow-lg transition-all hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl"
                >
                  <Key className="mr-2 h-5 w-5" />
                  {isLoading ? '⏳ Đang đổi...' : '🔐 Đổi mật khẩu'}
                </Button>
              </div>
            </CardContent>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <div className="overflow-hidden rounded-3xl border-0 shadow-xl">
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 p-0">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute bottom-0 left-0 h-40 w-40 -translate-x-1/2 translate-y-1/2 rounded-full bg-white"></div>
              </div>
              <div className="relative px-8 py-6">
                <CardTitle className="flex items-center gap-2 text-2xl font-bold text-white">
                  <Bell className="h-6 w-6" />
                  🔔 Cài đặt thông báo
                </CardTitle>
                <CardDescription className="mt-2 text-sm text-orange-100">
                  Quản lý cách bạn nhận thông báo qua email
                </CardDescription>
              </div>
            </div>
            <CardContent className="space-y-6 bg-gradient-to-b from-gray-50 to-white p-8">
              <div className="space-y-4">
                {/* Email Notifications */}
                <div className="flex items-center justify-between rounded-2xl border-2 border-gray-200 bg-white p-4 transition-all duration-300 hover:border-amber-300 hover:bg-amber-50">
                  <div className="flex-1 space-y-0.5">
                    <Label className="text-sm font-bold text-gray-800">
                      📧 Thông báo email chung
                    </Label>
                    <p className="text-sm text-gray-600">Nhận thông báo quan trọng qua email</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>

                {/* Login Alerts */}
                <div className="flex items-center justify-between rounded-2xl border-2 border-gray-200 bg-white p-4 transition-all duration-300 hover:border-red-300 hover:bg-red-50">
                  <div className="flex-1 space-y-0.5">
                    <Label className="text-sm font-bold text-gray-800">🚨 Cảnh báo đăng nhập</Label>
                    <p className="text-sm text-gray-600">
                      Thông báo khi có đăng nhập từ thiết bị mới
                    </p>
                  </div>
                  <Switch checked={loginAlerts} onCheckedChange={setLoginAlerts} />
                </div>

                {/* System Updates */}
                <div className="flex items-center justify-between rounded-2xl border-2 border-gray-200 bg-white p-4 transition-all duration-300 hover:border-blue-300 hover:bg-blue-50">
                  <div className="flex-1 space-y-0.5">
                    <Label className="text-sm font-bold text-gray-800">⚙️ Cập nhật hệ thống</Label>
                    <p className="text-sm text-gray-600">
                      Thông báo về cập nhật và bảo trì hệ thống
                    </p>
                  </div>
                  <Switch checked={systemUpdates} onCheckedChange={setSystemUpdates} />
                </div>

                {/* Marketing Emails */}
                <div className="flex items-center justify-between rounded-2xl border-2 border-gray-200 bg-white p-4 transition-all duration-300 hover:border-green-300 hover:bg-green-50">
                  <div className="flex-1 space-y-0.5">
                    <Label className="text-sm font-bold text-gray-800">📢 Email marketing</Label>
                    <p className="text-sm text-gray-600">Nhận email về sản phẩm và dịch vụ mới</p>
                  </div>
                  <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
                </div>
              </div>

              <Separator className="my-6 h-1 bg-gradient-to-r from-amber-200 to-orange-200" />

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveNotifications}
                  disabled={isLoading}
                  className="rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 font-bold text-white shadow-lg transition-all hover:from-amber-700 hover:to-orange-700 hover:shadow-xl"
                >
                  <Save className="mr-2 h-5 w-5" />
                  {isLoading ? '⏳ Đang lưu...' : '💾 Lưu cài đặt'}
                </Button>
              </div>
            </CardContent>
          </div>
        )}
      </div>
    </div>
  )
}
