'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, Loader2, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { changePasswordForClient } from '@/lib/auth/server-actions'
import { ROUTES } from '@/constants/routes'
import { useLocale } from '@/components/providers/LocaleProvider'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [isRequired, setIsRequired] = useState(false)
  const { t } = useLocale()

  // Avoid using `useSearchParams()` at the top-level page (it causes a CSR bailout
  // that Next expects to be wrapped in a Suspense boundary). Read the query
  // params directly from window.location on the client instead.
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search)
      setIsRequired(sp.get('required') === 'true')
    } catch {
      setIsRequired(false)
    }
  }, [])

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Prevent closing if password change is required
  useEffect(() => {
    if (isRequired) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault()
        e.returnValue = ''
      }
      window.addEventListener('beforeunload', handleBeforeUnload)
      return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }
    return undefined
  }, [isRequired])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError(t('auth.errors.required_fields'))
      return
    }

    if (newPassword.length < 8) {
      setError(t('auth.errors.password_min'))
      return
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.errors.password_mismatch'))
      return
    }

    if (oldPassword === newPassword) {
      setError(t('auth.change_password.errors.new_must_differ'))
      return
    }

    try {
      setIsSubmitting(true)

      const result = await changePasswordForClient({
        currentPassword: oldPassword,
        newPassword,
      })

      const isObject = typeof result === 'object' && result !== null

      if (
        isObject &&
        'authExpired' in result &&
        (result as { authExpired?: boolean }).authExpired
      ) {
        router.push('/login')
        return
      }

      const payload = isObject ? (result as Record<string, unknown>) : {}
      const successFlag =
        typeof payload['success'] === 'boolean' ? (payload['success'] as boolean) : undefined
      const message = typeof payload['message'] === 'string' ? (payload['message'] as string) : ''

      if (successFlag === false) {
        const fieldErrors = payload['errors'] as Record<string, unknown> | undefined
        const errorText =
          (fieldErrors?.currentPassword as string) ||
          (fieldErrors?.newPassword as string) ||
          (fieldErrors?.confirmPassword as string) ||
          String(payload['error'] ?? payload['message'] ?? t('auth.change_password.errors.generic'))

        setError(errorText)
        toast.error(errorText)
        return
      }

      setSuccess(true)
      let isDefaultCustomerCookie = false

      // Sau khi đổi mật khẩu:
      // - Nếu là flow bắt buộc (required=true) -> quay về khu vực system nếu login là customer-admin
      // - Ngược lại (user thường) -> về dashboard user
      setTimeout(() => {
        try {
          toast.success(message || t('auth.change_password.success'))
          if (typeof document !== 'undefined') {
            const cookies = document.cookie.split(';')
            const found = cookies.find((c) => c.trim().startsWith('mps_is_default_customer='))
            if (found) {
              const val = found.split('=')[1]
              isDefaultCustomerCookie = String(val) === 'true'
            }
          }

          if (isRequired && isDefaultCustomerCookie) {
            router.push(ROUTES.CUSTOMER_ADMIN)
            return
          }

          // Default: user dashboard
          router.push(ROUTES.USER_DASHBOARD)
        } catch {
          router.push(ROUTES.USER_DASHBOARD)
        }
      }, 1200)
    } catch (err: unknown) {
      console.error('Change password error:', err)
      const eObj = err as Record<string, unknown>
      const resp = (eObj.response as Record<string, unknown> | undefined) || undefined
      const data = (resp?.data as Record<string, unknown> | undefined) || undefined
      const errorMessage =
        (data && typeof data.message === 'string' && data.message) ||
        (typeof eObj.message === 'string' && eObj.message) ||
        'Đổi mật khẩu thất bại. Vui lòng thử lại.'
      setError(String(errorMessage))
      toast.error(String(errorMessage))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--brand-50)] via-[var(--brand-50)] to-[var(--brand-50)] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="relative overflow-hidden border-0 shadow-2xl">
          {/* Gradient Background */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--brand-600)] via-[var(--brand-600)] to-[var(--brand-700)] opacity-5" />

          <CardHeader className="relative space-y-4">
            <motion.div
              className="flex justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-600)] to-[var(--brand-500)] shadow-lg">
                <Lock className="h-10 w-10 text-white" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CardTitle className="text-center text-3xl font-bold">
                {isRequired
                  ? t('auth.change_password.title_required')
                  : t('auth.change_password.title')}
              </CardTitle>
              <CardDescription className="mt-2 text-center text-base">
                {isRequired
                  ? t('auth.change_password.required_desc')
                  : t('auth.change_password.description')}
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success message */}
              {success && (
                <Alert
                  variant="default"
                  className="border-[var(--color-success-200)] bg-[var(--color-success-50)] text-[var(--color-success-600)]"
                >
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{t('auth.change_password.success_redirect')}</AlertDescription>
                </Alert>
              )}

              {/* Old Password */}
              <div className="space-y-2">
                <Label htmlFor="oldPassword">{t('auth.change_password.old_password_label')}</Label>
                <div className="relative">
                  <Input
                    id="oldPassword"
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder={t('auth.change_password.old_password_placeholder')}
                    required
                    disabled={isSubmitting || success}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('auth.change_password.new_password_label')}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('auth.change_password.new_password_placeholder')}
                    required
                    disabled={isSubmitting || success}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {t('auth.change_password.confirm_password_label')}
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('auth.change_password.confirm_password_placeholder')}
                    required
                    disabled={isSubmitting || success}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
                disabled={isSubmitting || success}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? t('auth.sending') : t('auth.change_password.action')}
              </Button>

              {/* Cancel button - only show if not required */}
              {!isRequired && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.back()}
                  disabled={isSubmitting || success}
                >
                  {t('auth.cancel')}
                </Button>
              )}
            </form>

            {isRequired && (
              <div className="mt-4 rounded-lg bg-amber-50 p-3 text-center">
                <p className="text-sm text-amber-800">
                  ⚠️ {t('auth.change_password.must_change_warning')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
