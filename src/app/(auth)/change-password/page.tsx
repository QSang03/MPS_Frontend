'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

export default function ChangePasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isRequired = searchParams.get('required') === 'true'

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
      setError('Vui lòng điền đầy đủ thông tin')
      return
    }

    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    if (oldPassword === newPassword) {
      setError('Mật khẩu mới phải khác mật khẩu cũ')
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
          String(
            payload['error'] ?? payload['message'] ?? 'Đổi mật khẩu thất bại. Vui lòng thử lại.'
          )

        setError(errorText)
        toast.error(errorText)
        return
      }

      if (payload['error'] && successFlag !== true) {
        const errorText = String(payload['error'] || 'Đổi mật khẩu thất bại. Vui lòng thử lại.')
        setError(errorText)
        toast.error(errorText)
        return
      }

      setSuccess(true)
      toast.success(message || 'Đổi mật khẩu thành công!')

      setTimeout(() => {
        router.push(ROUTES.CUSTOMER_ADMIN)
      }, 2000)
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="relative overflow-hidden border-0 shadow-2xl">
          {/* Gradient Background */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500 via-cyan-600 to-teal-700 opacity-5" />

          <CardHeader className="relative space-y-4">
            <motion.div
              className="flex justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
                <Lock className="h-10 w-10 text-white" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CardTitle className="text-center text-3xl font-bold">
                {isRequired ? 'Đổi mật khẩu bắt buộc' : 'Đổi mật khẩu'}
              </CardTitle>
              <CardDescription className="mt-2 text-center text-base">
                {isRequired
                  ? 'Bạn đang sử dụng mật khẩu mặc định. Vui lòng đổi mật khẩu để tiếp tục.'
                  : 'Nhập mật khẩu cũ và mật khẩu mới'}
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
                <Alert variant="default" className="border-green-200 bg-green-50 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>Đổi mật khẩu thành công! Đang chuyển hướng...</AlertDescription>
                </Alert>
              )}

              {/* Old Password */}
              <div className="space-y-2">
                <Label htmlFor="oldPassword">Mật khẩu cũ</Label>
                <div className="relative">
                  <Input
                    id="oldPassword"
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Nhập mật khẩu cũ"
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
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
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
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
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
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                disabled={isSubmitting || success}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Đang xử lý...' : 'Đổi mật khẩu'}
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
                  Hủy
                </Button>
              )}
            </form>

            {isRequired && (
              <div className="mt-4 rounded-lg bg-amber-50 p-3 text-center">
                <p className="text-sm text-amber-800">
                  ⚠️ Bạn phải đổi mật khẩu mới có thể sử dụng hệ thống
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
