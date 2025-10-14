'use client'

import { useActionState } from 'react'
import { motion } from 'framer-motion'
import { login, type LoginActionState } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, Printer, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<LoginActionState, FormData>(login, null)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="shadow-soft-2xl relative overflow-hidden border-0">
        {/* Gradient Background */}
        <div className="from-brand-500 via-brand-600 to-brand-700 absolute inset-0 bg-gradient-to-br opacity-5" />

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
              Chào mừng đến MPS
            </CardTitle>
            <CardDescription className="mt-2 text-center text-base">
              Nhập thông tin đăng nhập để truy cập hệ thống
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

            {/* Username field */}
            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Nhập tên đăng nhập"
                required
                disabled={isPending}
                autoComplete="username"
                className={state?.error?.username ? 'border-destructive' : ''}
              />
              {state?.error?.username && (
                <p className="text-destructive text-sm">{state.error.username[0]}</p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Nhập mật khẩu"
                required
                disabled={isPending}
                autoComplete="current-password"
                className={state?.error?.password ? 'border-destructive' : ''}
              />
              {state?.error?.password && (
                <p className="text-destructive text-sm">{state.error.password[0]}</p>
              )}
            </div>

            {/* Submit button */}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>

          <div className="text-muted-foreground mt-4 text-center text-sm">
            <p>Tài khoản demo:</p>
            <p className="mt-1 text-xs">Admin: admin / admin123 | User: user / user123</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
