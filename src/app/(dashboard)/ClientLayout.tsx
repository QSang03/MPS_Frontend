'use client'

import dynamic from 'next/dynamic'
import { NavigationProvider } from '@/contexts/NavigationContext'
import { Navbar } from '@/components/layout/Navbar'
import type { Session } from '@/types/auth'

// Render sidebar only on the client to avoid SSR/client markup mismatches
const ModernSidebar = dynamic(
  () => import('@/components/layout/ModernSidebar').then((mod) => mod.ModernSidebar),
  { ssr: false }
)

interface ClientLayoutProps {
  children: React.ReactNode
  session: Session
}

export function ClientLayout({ children, session }: ClientLayoutProps) {
  return (
    <NavigationProvider>
      <div className="flex h-screen overflow-hidden">
        <ModernSidebar session={session} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Navbar session={session} />
          <main className="bg-muted/30 flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </NavigationProvider>
  )
}
