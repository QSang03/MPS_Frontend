'use client'

import { useEffect, useState, startTransition } from 'react'
import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { resetPassword } from '@/app/actions/auth'
import type { AuthActionState } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/components/providers/LocaleProvider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ROUTES } from '@/constants/routes'

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(
    resetPassword,
    null
  )
  const router = useRouter()
  const [token] = useState<string | null>(() => {
    try {
      if (typeof window === 'undefined') return null
      const sp = new URLSearchParams(window.location.search)
      return sp.get('token')
    } catch {
      return null
    }
  })
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const { t } = useLocale()

  // Handle success -> show toast and redirect to login
  useEffect(() => {
    if (state?.success?.message) {
      toast.success(state.success.message)
      const t = setTimeout(() => router.push(ROUTES.LOGIN), 1400)
      return () => clearTimeout(t)
    }
    return undefined
  }, [state?.success?.message, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError(t('auth.errors.invalid_token'))
      return
    }

    if (!newPassword || !confirmPassword) {
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

    const fd = new FormData()
    fd.set('token', token)
    fd.set('newPassword', newPassword)

    // Call server action inside a transition so `isPending` updates correctly
    startTransition(() => {
      formAction(fd)
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--brand-50)] via-[var(--brand-50)] to-[var(--brand-50)] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md"
      >
        <Card className="relative overflow-hidden border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              {t('auth.reset_password.title')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('auth.reset_password.description')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {state?.error?.message && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{state.error.message}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('auth.reset_password.new_password_label')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('auth.reset_password.new_password_placeholder')}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {t('auth.reset_password.confirm_password_label')}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.reset_password.confirm_password_placeholder')}
                  required
                  disabled={isPending}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? t('auth.sending') : t('auth.reset_password.action')}
              </Button>

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => router.push(ROUTES.LOGIN)}
              >
                {t('auth.back_to_login')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
