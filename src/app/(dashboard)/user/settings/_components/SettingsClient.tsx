'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { changePasswordForClient } from '@/lib/auth/server-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  const [profile] = useState(initialProfile)
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
    // only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Form states
  const [firstName, setFirstName] = useState(profile?.user.firstName || '')
  const [lastName, setLastName] = useState(profile?.user.lastName || '')
  const [username, setUsername] = useState(profile?.user.username || '')

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
  // Field-level errors
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null)
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Không thể tải thông tin cài đặt</p>
        </CardContent>
      </Card>
    )
  }

  const handleSaveAccount = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      // TODO: Implement update profile API call
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

      setMessage({ success: true, text: 'Cập nhật thông tin thành công!' })
    } catch {
      setMessage({ success: false, text: 'Có lỗi xảy ra khi cập nhật thông tin' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    // Clear previous errors
    setCurrentPasswordError(null)
    setNewPasswordError(null)
    setConfirmPasswordError(null)
    setMessage(null)

    // Client-side validations (set field errors)
    let hasError = false

    if (!currentPassword) {
      setCurrentPasswordError('Mật khẩu hiện tại là bắt buộc')
      hasError = true
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Mật khẩu xác nhận không khớp')
      hasError = true
    }

    // Enforce password complexity: minimum 8 chars, at least 1 lowercase, 1 uppercase, and 1 digit
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(newPassword)) {
      setNewPasswordError(
        'Mật khẩu mới phải có ít nhất 8 ký tự, chứa 1 chữ thường, 1 chữ hoa và 1 số'
      )
      hasError = true
    }

    // Ensure new password is not the same as current password
    if (currentPassword && currentPassword === newPassword) {
      setNewPasswordError('Mật khẩu mới không được giống mật khẩu hiện tại')
      hasError = true
    }

    if (hasError) return

    setIsLoading(true)

    try {
      // Call server action which will call backend securely
      const res = await changePasswordForClient({ currentPassword, newPassword })

      // Narrow and inspect response safely
      const isObj = (v: unknown): v is Record<string, unknown> =>
        typeof v === 'object' && v !== null

      if (isObj(res)) {
        // If server indicates refresh token expired, force client to login
        if ((res as Record<string, unknown>).authExpired === true) {
          // navigate to login page
          router.push('/auth/login')
          return
        }
        const hasSuccess = Object.prototype.hasOwnProperty.call(res, 'success')
        const payload = res as Record<string, unknown>

        if (hasSuccess) {
          if (payload.success === true) {
            setMessage({
              success: true,
              text: String(payload.message || 'Đổi mật khẩu thành công!'),
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
              text: String(payload.message || 'Đổi mật khẩu thành công!'),
            })
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
          }
        }
      } else {
        // Unexpected response shape — treat as success
        setMessage({ success: true, text: 'Đổi mật khẩu thành công!' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setMessage({ success: false, text: 'Có lỗi xảy ra khi đổi mật khẩu' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      // TODO: Implement save notification settings API call
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

      setMessage({ success: true, text: 'Lưu cài đặt thông báo thành công!' })
    } catch {
      setMessage({ success: false, text: 'Có lỗi xảy ra khi lưu cài đặt' })
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
      {/* Message Alert */}
      {message && (
        <Alert
          variant={message.success ? 'default' : 'destructive'}
          className={
            message.success
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }
        >
          {message.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'account' | 'password' | 'notifications')}
                className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'text-muted-foreground hover:border-muted-foreground hover:text-foreground border-transparent'
                }`}
              >
                <Icon className="h-4 w-4" />
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Thông tin tài khoản
              </CardTitle>
              <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="text-muted-foreground h-4 w-4" />
                    <Input id="email" value={profile.user.email} disabled className="bg-muted" />
                  </div>
                  <p className="text-muted-foreground text-xs">Email không thể thay đổi</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Tên đăng nhập</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstName">Tên</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Nhập tên"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Họ</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Nhập họ"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSaveAccount} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Password Settings */}
        {activeTab === 'password' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Đổi mật khẩu
              </CardTitle>
              <CardDescription>Thay đổi mật khẩu để bảo mật tài khoản</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                  {currentPasswordError && (
                    <p className="mt-1 text-sm text-red-600">{currentPasswordError}</p>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                  />
                  {newPasswordError && (
                    <p className="mt-1 text-sm text-red-600">{newPasswordError}</p>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                  {confirmPasswordError && (
                    <p className="mt-1 text-sm text-red-600">{confirmPasswordError}</p>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleChangePassword} disabled={isLoading}>
                  <Key className="mr-2 h-4 w-4" />
                  {isLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Cài đặt thông báo
              </CardTitle>
              <CardDescription>Quản lý cách bạn nhận thông báo qua email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Thông báo email chung</Label>
                    <p className="text-muted-foreground text-sm">
                      Nhận thông báo quan trọng qua email
                    </p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cảnh báo đăng nhập</Label>
                    <p className="text-muted-foreground text-sm">
                      Thông báo khi có đăng nhập từ thiết bị mới
                    </p>
                  </div>
                  <Switch checked={loginAlerts} onCheckedChange={setLoginAlerts} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cập nhật hệ thống</Label>
                    <p className="text-muted-foreground text-sm">
                      Thông báo về cập nhật và bảo trì hệ thống
                    </p>
                  </div>
                  <Switch checked={systemUpdates} onCheckedChange={setSystemUpdates} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email marketing</Label>
                    <p className="text-muted-foreground text-sm">
                      Nhận email về sản phẩm và dịch vụ mới
                    </p>
                  </div>
                  <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? 'Đang lưu...' : 'Lưu cài đặt'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
