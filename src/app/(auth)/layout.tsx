import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login - MPS',
  description: 'Login to MPS - Managed Print Services',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
