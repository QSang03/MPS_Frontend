'use client'

import { NavigationProvider } from '@/contexts/NavigationContext'
import { ModernSidebar } from '@/components/layout/ModernSidebar'
import { Navbar } from '@/components/layout/Navbar'
import type { Session } from '@/types/auth'

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
