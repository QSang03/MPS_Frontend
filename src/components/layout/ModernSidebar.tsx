'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { UserCircle, ChevronLeft, Sparkles, LogOut, Printer } from 'lucide-react'
import type { Session } from '@/types/auth'
import { useUIStore } from '@/lib/store/uiStore'
import { logout } from '@/app/actions/auth'
import { useNavigation } from '@/contexts/NavigationContext'
import { SidebarNavItem } from '@/components/layout/SidebarWithSubmenu'
import { UserRole } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  ShoppingCart,
  FileText,
  BarChart3,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  submenu?: Array<{
    label: string
    href: string
  }>
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

interface SidebarProps {
  session: Session
}

export function ModernSidebar({ session }: SidebarProps) {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { currentSubmenu } = useNavigation()

  const navigation = getNavigationItems(session.role)

  const handleLogout = async () => {
    await logout()
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : '-100%',
        }}
        transition={{ type: 'spring', damping: 25 }}
        className={cn(
          'bg-background shadow-soft-xl fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r transition-transform duration-200 lg:static lg:translate-x-0',
          'bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950'
        )}
      >
        {/* Logo với Gradient */}
        <div className="flex h-20 items-center gap-3 border-b px-6">
          <div className="from-brand-500 to-brand-600 shadow-glow flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br">
            <Printer className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-x font-bold text-orange-600 dark:text-orange-400">
              CHÍNH NHÂN TECHNOLOGY
            </h1>
            <p className="text-brand-600 dark:text-brand-400 text-xs font-bold">
              MPS - Managed Print Services
            </p>
          </div>
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={toggleSidebar}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* User Profile Card */}
        <div className="from-brand-500 to-brand-600 shadow-soft-xl m-4 rounded-2xl bg-gradient-to-br p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <UserCircle className="h-7 w-7" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate font-semibold">{session.username}</p>
              <p className="text-brand-100 truncate text-sm">{session.role}</p>
            </div>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="text-brand-200 h-5 w-5" />
            </motion.div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4">
          {navigation.map((item, index) => {
            // Add submenu if this is the devices section and we have a current device
            const itemWithSubmenu = {
              ...item,
              submenu:
                item.href === '/customer-admin/devices' &&
                currentSubmenu?.href.includes('/devices/')
                  ? [currentSubmenu]
                  : item.href === '/customer-admin/service-requests' &&
                      currentSubmenu?.href.includes('/service-requests/')
                    ? [currentSubmenu]
                    : item.href === '/customer-admin/purchase-requests' &&
                        currentSubmenu?.href.includes('/purchase-requests/')
                      ? [currentSubmenu]
                      : item.href === '/customer-admin/users' &&
                          currentSubmenu?.href.includes('/users/')
                        ? [currentSubmenu]
                        : undefined,
            }

            return <SidebarNavItem key={item.href} item={itemWithSubmenu} index={index} />
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <button
            onClick={handleLogout}
            className="hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-950 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-neutral-700 transition-all dark:text-neutral-300"
          >
            <LogOut className="h-5 w-5" />
            Đăng xuất
          </button>
          <p className="text-muted-foreground mt-4 text-center text-xs">
            MPS v1.0.0
            <br />© 2025 All rights reserved
          </p>
        </div>
      </motion.aside>
    </>
  )
}
