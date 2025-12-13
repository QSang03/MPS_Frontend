'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { forgotPassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/components/providers/LocaleProvider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import type { AuthActionState } from '@/app/actions/auth'

export default function ForgotPasswordPage() {
  const { t } = useLocale()
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(
    forgotPassword,
    null
  )
  const router = useRouter()

  // Show success message once and redirect to login
  useEffect(() => {
    if (state?.success?.message) {
      toast.success(state.success.message)
      const t = setTimeout(() => router.push('/login'), 1400)
      return () => clearTimeout(t)
    }
    return undefined
  }, [state?.success?.message, router])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="shadow-soft-2xl relative overflow-hidden border-0">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            {t('auth.forgot_password.title')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('auth.forgot_password.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {state?.error?.message && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.error.message}</AlertDescription>
              </Alert>
            )}

            {state?.success?.message && (
              <Alert variant="default" className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{state.success.message}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t('auth.forgot_password.email_placeholder')}
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? t('auth.sending') : t('auth.forgot_password.submit')}
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => router.push('/login')}
            >
              {t('auth.back_to_login')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
