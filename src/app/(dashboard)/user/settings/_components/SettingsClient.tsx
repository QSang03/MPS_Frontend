'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { changePasswordForClient, getUserProfileForClient } from '@/lib/auth/server-actions'
import internalApiClient from '@/lib/api/internal-client'
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Key, User, Bell, Save, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import type { UserProfile } from '@/types/auth'
import { useLocale } from '@/components/providers/LocaleProvider'

interface SettingsClientProps {
  initialProfile: UserProfile | null
  initialTab?: 'account' | 'password' | 'notifications'
}

export function SettingsClient({ initialProfile, initialTab = 'account' }: SettingsClientProps) {
  const { t } = useLocale()
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
  }, [searchParams])

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
  }, [profile, router])

  // Form states — only show fields supported by API (/profile)
  // Use `attributes.name` and `attributes.phone` from the profile
  const [attrName, setAttrName] = useState('')
  const [attrPhone, setAttrPhone] = useState('')
  const [attrRole, setAttrRole] = useState('')

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
      const u = profile.user
      const attrs = (u.attributes as Record<string, unknown> | undefined) || {}
      setAttrName(
        u.fullName || (attrs.fullName as string) || u.name || (attrs.name as string) || ''
      )
      setAttrPhone((attrs.phone as string) || '')
      setAttrRole((attrs.role as string) || '')
    }
  }, [profile])

  if (!profile) {
    return (
      <Card className="rounded-3xl border-2 border-gray-200">
        <CardContent className="p-8 text-center">
          <p className="text-lg text-gray-500">
            {isFetchingProfile ? t('settings.loading') : t('settings.load_error')}
          </p>
        </CardContent>
      </Card>
    )
  }

  const handleSaveAccount = async () => {
    setIsLoading(true)
    setMessage(null)

    const payload: Record<string, unknown> = {
      attributes: {
        fullName: attrName || undefined,
        phone: attrPhone || undefined,
        role: attrRole || undefined,
      },
    }

    try {
      const response = await internalApiClient.patch('/api/profile', payload)
      const respData = response.data as unknown

      // respData may be: { success: true, data: { user } } or the user profile directly
      if (respData && typeof respData === 'object') {
        const obj = respData as Record<string, unknown>
        if (Object.prototype.hasOwnProperty.call(obj, 'success')) {
          const success = Boolean(obj.success)
          if (success) {
            const maybeData = obj.data as Record<string, unknown> | undefined
            if (maybeData && Object.prototype.hasOwnProperty.call(maybeData, 'user')) {
              setProfile(maybeData as unknown as UserProfile)
            }
            setMessage({
              success: true,
              text: String(obj.message || t('settings.account.update_success')),
            })
            return
          }
          setMessage({
            success: false,
            text: String(obj.message || t('settings.account.update_error')),
          })
          return
        }
        if (Object.prototype.hasOwnProperty.call(obj, 'user')) {
          setProfile(respData as UserProfile)
          setMessage({ success: true, text: t('settings.account.update_success') })
          return
        }
      }
      setMessage({ success: true, text: t('settings.account.update_success') })
    } catch (err) {
      console.error('Update profile failed:', err)
      setMessage({ success: false, text: t('settings.account.update_error') })
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
      setCurrentPasswordError(t('settings.password.current_required'))
      hasError = true
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError(t('settings.password.confirm_mismatch'))
      hasError = true
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/
    if (!passwordRegex.test(newPassword)) {
      setNewPasswordError(t('settings.password.requirements'))
      hasError = true
    }

    if (currentPassword && currentPassword === newPassword) {
      setNewPasswordError(t('settings.password.same_as_current'))
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
              text: String(payload.message || t('settings.password.change_success')),
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
              const errText = String(
                payload.error || payload.message || t('settings.password.change_error')
              )
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
              text: String(payload.message || t('settings.password.change_success')),
            })
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
          }
        }
      } else {
        setMessage({ success: true, text: t('settings.password.change_success') })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setMessage({ success: false, text: t('settings.password.change_error') })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setMessage({ success: true, text: t('settings.notifications.save_success') })
    } catch {
      setMessage({ success: false, text: t('settings.notifications.save_error') })
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'account', label: t('settings.tabs.account'), icon: User },
    { id: 'password', label: t('settings.tabs.password'), icon: Key },
    { id: 'notifications', label: t('settings.tabs.notifications'), icon: Bell },
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
              : 'border-[var(--color-error-200)] bg-gradient-to-r from-[var(--color-error-50)] to-[var(--color-error-50)] text-[var(--color-error-500)]'
          }`}
        >
          {message.success ? (
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-[var(--color-error-500)]" />
          )}
          <AlertDescription className="font-semibold">{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Tab Navigation */}
      <div className="border-border border-b">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'account' | 'password' | 'notifications')}
                className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground border-transparent'
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
                {t('settings.account.title')}
              </CardTitle>
              <CardDescription>{t('settings.account.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Email removed: email is not editable and will not be shown here */}

                {/* Username (readonly) */}
                <div className="space-y-2">
                  <Label htmlFor="username">{t('settings.account.username')}</Label>
                  <Input
                    id="username"
                    value={profile.user.username || profile.user.email}
                    disabled
                    className="bg-muted"
                  />
                </div>

                {/* Name (attributes.name) */}
                <div className="space-y-2">
                  <Label htmlFor="name">{t('settings.account.first_name')}</Label>
                  <Input
                    id="name"
                    value={attrName}
                    onChange={(e) => setAttrName(e.target.value)}
                    placeholder={t('settings.account.first_name_placeholder')}
                  />
                </div>

                {/* Phone (attributes.phone) */}
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('user.field.phone')}</Label>
                  <Input
                    id="phone"
                    value={attrPhone}
                    onChange={(e) => setAttrPhone(e.target.value)}
                    placeholder={t('user.placeholder.phone')}
                  />
                </div>

                {/* Role (attributes.role) */}
                <div className="space-y-2">
                  <Label htmlFor="role">{t('user.field.role_attribute')}</Label>
                  <Input
                    id="role"
                    value={attrRole}
                    onChange={(e) => setAttrRole(e.target.value)}
                    placeholder={t('user.placeholder.role_attribute')}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSaveAccount} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? t('button.saving') : t('device.save_changes')}
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
                {t('settings.password.title')}
              </CardTitle>
              <CardDescription>{t('settings.password.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t('settings.password.current')}</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t('settings.password.current_placeholder')}
                    className={currentPasswordError ? 'border-destructive' : ''}
                  />
                  {currentPasswordError && (
                    <p className="text-destructive mt-1 text-sm font-medium">
                      {currentPasswordError}
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute top-0 right-0 h-full px-3 py-2"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="text-muted-foreground h-4 w-4" />
                    ) : (
                      <Eye className="text-muted-foreground h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('settings.password.new')}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('settings.password.new_placeholder')}
                    className={newPasswordError ? 'border-destructive' : ''}
                  />
                  {newPasswordError && (
                    <p className="text-destructive mt-1 text-sm font-medium">{newPasswordError}</p>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute top-0 right-0 h-full px-3 py-2"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="text-muted-foreground h-4 w-4" />
                    ) : (
                      <Eye className="text-muted-foreground h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('settings.password.confirm')}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('settings.password.confirm_placeholder')}
                    className={confirmPasswordError ? 'border-destructive' : ''}
                  />
                  {confirmPasswordError && (
                    <p className="text-destructive mt-1 text-sm font-medium">
                      {confirmPasswordError}
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute top-0 right-0 h-full px-3 py-2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="text-muted-foreground h-4 w-4" />
                    ) : (
                      <Eye className="text-muted-foreground h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg border p-4">
                <p className="text-muted-foreground text-xs">
                  <span className="font-bold">{t('settings.password.requirements_label')}:</span>{' '}
                  {t('settings.password.requirements_text')}
                </p>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleChangePassword} disabled={isLoading}>
                  <Key className="mr-2 h-4 w-4" />
                  {isLoading
                    ? t('settings.password.changing')
                    : t('settings.password.change_button')}
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
                {t('settings.notifications.title')}
              </CardTitle>
              <CardDescription>{t('settings.notifications.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {/* Email Notifications */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex-1 space-y-0.5">
                    <Label className="text-base">{t('settings.notifications.email_general')}</Label>
                    <p className="text-muted-foreground text-sm">
                      {t('settings.notifications.email_general_desc')}
                    </p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>

                {/* Login Alerts */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex-1 space-y-0.5">
                    <Label className="text-base">{t('settings.notifications.login_alerts')}</Label>
                    <p className="text-muted-foreground text-sm">
                      {t('settings.notifications.login_alerts_desc')}
                    </p>
                  </div>
                  <Switch checked={loginAlerts} onCheckedChange={setLoginAlerts} />
                </div>

                {/* System Updates */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex-1 space-y-0.5">
                    <Label className="text-base">
                      {t('settings.notifications.system_updates')}
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      {t('settings.notifications.system_updates_desc')}
                    </p>
                  </div>
                  <Switch checked={systemUpdates} onCheckedChange={setSystemUpdates} />
                </div>

                {/* Marketing Emails */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex-1 space-y-0.5">
                    <Label className="text-base">
                      {t('settings.notifications.marketing_emails')}
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      {t('settings.notifications.marketing_emails_desc')}
                    </p>
                  </div>
                  <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? t('button.saving') : t('settings.notifications.save_button')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
