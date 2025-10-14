'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Printer,
  FileText,
  Users,
  Settings,
  ShoppingCart,
  BarChart3,
  ChevronLeft,
  Building2,
  UserCircle,
} from 'lucide-react'
import type { Session } from '@/lib/auth/session'
import { useUIStore } from '@/lib/store/uiStore'
import { UserRole } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'

interface SidebarProps {
  session: Session
}

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

export function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useUIStore()

  const navigation = getNavigationItems(session.role)

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={toggleSidebar} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'bg-background fixed inset-y-0 left-0 z-50 w-64 transform border-r transition-transform duration-200 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <Printer className="text-primary-foreground h-5 w-5" />
              </div>
              <span className="text-xl font-bold">MPS</span>
            </div>
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={toggleSidebar}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>

          {/* User info */}
          <div className="border-b p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
                <UserCircle className="h-6 w-6" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{session.username}</p>
                <p className="text-muted-foreground truncate text-xs">{session.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navigation.map((item) => {
              // Fix: Only exact match, except for dashboard which should only be active when exactly on that route
              const isActive =
                item.href === '/customer-admin'
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-destructive flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-xs text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <p className="text-muted-foreground text-xs">
              MPS v1.0.0
              <br />© 2025 All rights reserved
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}

function getNavigationItems(role: UserRole): NavItem[] {
  if (role === UserRole.SYSTEM_ADMIN) {
    return [
      { label: 'Khách hàng', href: ROUTES.SYSTEM_ADMIN_CUSTOMERS, icon: Building2 },
      { label: 'Tài khoản', href: ROUTES.SYSTEM_ADMIN_ACCOUNTS, icon: Users },
      { label: 'Cài đặt', href: ROUTES.SYSTEM_ADMIN_SETTINGS, icon: Settings },
    ]
  }

  if (role === UserRole.CUSTOMER_ADMIN) {
    return [
      { label: 'Tổng quan', href: ROUTES.CUSTOMER_ADMIN, icon: LayoutDashboard },
      { label: 'Thiết bị', href: ROUTES.CUSTOMER_ADMIN_DEVICES, icon: Printer },
      {
        label: 'Yêu cầu bảo trì',
        href: ROUTES.CUSTOMER_ADMIN_SERVICE_REQUESTS,
        icon: FileText,
      },
      {
        label: 'Yêu cầu mua hàng',
        href: ROUTES.CUSTOMER_ADMIN_PURCHASE_REQUESTS,
        icon: ShoppingCart,
      },
      { label: 'Người dùng', href: ROUTES.CUSTOMER_ADMIN_USERS, icon: Users },
      { label: 'Báo cáo', href: ROUTES.CUSTOMER_ADMIN_REPORTS, icon: BarChart3 },
    ]
  }

  // Regular User
  return [
    { label: 'Thiết bị của tôi', href: ROUTES.USER_MY_DEVICES, icon: Printer },
    { label: 'Yêu cầu của tôi', href: ROUTES.USER_MY_REQUESTS, icon: FileText },
    { label: 'Hồ sơ', href: ROUTES.USER_PROFILE, icon: Settings },
  ]
}
