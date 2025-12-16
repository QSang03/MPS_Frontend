'use client'

import { useActionState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { login, type LoginActionState } from '@/app/actions/auth'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, Loader2, Printer, Sparkles } from 'lucide-react'
import { ROUTES } from '@/constants/routes'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<LoginActionState, FormData>(login, null)
  const router = useRouter()
  const queryClient = useQueryClient()

  // Redirect on successful login
  useEffect(() => {
    if (state?.success?.message && !isPending) {
      // Clear react-query cache now that user credentials/session changed
      try {
        queryClient.clear()
      } catch {
        // ignore
      }
      // Persist isDefaultCustomer flag to client-side cookie so client code can read it
      try {
        if (typeof state.success.isDefaultCustomer !== 'undefined') {
          Cookies.set('mps_is_default_customer', String(state.success.isDefaultCustomer), {
            path: '/',
            sameSite: 'lax',
          })
        }
        // Clear cached navigation to force re-fetch after login
        try {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('mps_navigation')
          }
        } catch {
          // ignore
        }
        // Persist customer name to localStorage for header display
        if (typeof window !== 'undefined' && state.success.customerName) {
          try {
            localStorage.setItem('mps_customer_name', state.success.customerName)
          } catch {
            // ignore
          }
        }
        // Persist normalized role (lowercased) for UI to localStorage if provided
        if (typeof window !== 'undefined' && state.success.roleName) {
          try {
            localStorage.setItem('mps_user_role', String(state.success.roleName).toLowerCase())
          } catch {
            // ignore
          }
        }
        // Persist roleId to localStorage
        if (typeof window !== 'undefined') {
          try {
            if (state.success.roleId) {
              localStorage.setItem('mps_role_id', state.success.roleId)
              console.log('[LoginPage] Set mps_role_id to localStorage:', state.success.roleId)
            } else {
              localStorage.removeItem('mps_role_id')
              console.log('[LoginPage] Removed mps_role_id from localStorage (roleId is undefined)')
            }
          } catch {
            // ignore
          }
        }
        // Persist userId to localStorage
        if (typeof window !== 'undefined' && state.success.userId) {
          try {
            localStorage.setItem('mps_user_id', state.success.userId)
          } catch {
            // ignore
          }
        }
        // Persist customerId to localStorage
        if (typeof window !== 'undefined' && state.success.customerId) {
          try {
            localStorage.setItem('mps_customer_id', state.success.customerId)
          } catch {
            // ignore
          }
        }
        // Persist isDefaultCustomer to localStorage
        if (
          typeof window !== 'undefined' &&
          typeof state.success.isDefaultCustomer !== 'undefined'
        ) {
          try {
            localStorage.setItem('mps_is_default_customer', String(state.success.isDefaultCustomer))
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
      // Check if user needs to change default password
      if (state.success.isDefaultPassword) {
        // Redirect to change password page immediately
        router.push('/change-password?required=true')
        return
      }

      // Show success message for 1.5 seconds then redirect based on isDefaultCustomer
      const timer = setTimeout(() => {
        // Nếu vẫn đang dùng mật khẩu mặc định, đã redirect lên change-password ở trên
        // nên không cần redirect lần nữa từ login.
        if (state.success?.isDefaultPassword) return

        const target = state.success?.isDefaultCustomer
          ? ROUTES.CUSTOMER_ADMIN
          : ROUTES.USER_DASHBOARD
        router.push(target)
      }, 1500)

      return () => clearTimeout(timer)
    }
    return undefined
  }, [state, isPending, router, queryClient])

  const { t } = useLocale()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="shadow-soft-2xl relative overflow-hidden border-0">
        {/* Gradient Background */}
        <div className="from-brand-500 via-brand-600 to-brand-700 pointer-events-none absolute inset-0 bg-gradient-to-br opacity-5" />

        <CardHeader className="relative space-y-4">
          <motion.div
            className="flex justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <div className="from-brand-500 to-brand-600 shadow-glow relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br">
              <Printer className="h-10 w-10 text-white" />
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Sparkles className="text-brand-400 h-5 w-5" />
              </motion.div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CardTitle className="font-display text-center text-3xl font-bold">
              {t('auth.welcome_title')}
            </CardTitle>
            <CardDescription className="mt-2 text-center text-base">
              {t('auth.welcome_description')}
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {/* Global error message */}
            {state?.error?.message && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.error.message}</AlertDescription>
              </Alert>
            )}

            {/* Success message */}
            {state?.success?.message && (
              <Alert variant="default" className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{state.success.message}</AlertDescription>
              </Alert>
            )}

            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email_label')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t('auth.placeholder.email')}
                required
                disabled={isPending}
                autoComplete="email"
                className={`relative z-10 ${state?.error?.email ? 'border-destructive' : ''}`}
                style={{ pointerEvents: isPending ? 'none' : 'auto' }}
              />
              {state?.error?.email && (
                <p className="text-destructive text-sm">{state.error.email[0]}</p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password_label')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={t('auth.placeholder.password')}
                required
                disabled={isPending}
                autoComplete="current-password"
                className={`relative z-10 ${state?.error?.password ? 'border-destructive' : ''}`}
                style={{ pointerEvents: isPending ? 'none' : 'auto' }}
              />
              {state?.error?.password && (
                <p className="text-destructive text-sm">{state.error.password[0]}</p>
              )}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className="text-sm text-[var(--brand-600)] hover:underline"
                >
                  {t('auth.forgot_password_link')}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? t('auth.sending') : t('auth.login_action')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
