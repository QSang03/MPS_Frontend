'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { ChevronLeft, LogOut, Printer, Zap, Shield } from 'lucide-react'
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
      { label: 'Cấu hình hệ thống', href: ROUTES.SYSTEM_ADMIN_SYSTEM_SETTINGS, icon: Settings },
      { label: 'Cài đặt', href: ROUTES.SYSTEM_ADMIN_SETTINGS, icon: Settings },
    ]
  }

  if (role === UserRole.CUSTOMER_ADMIN) {
    return [
      { label: 'Tổng quan', href: ROUTES.CUSTOMER_ADMIN, icon: LayoutDashboard },
      { label: 'Thiết bị', href: ROUTES.CUSTOMER_ADMIN_DEVICES, icon: Printer },
      { label: 'Mẫu thiết bị', href: ROUTES.CUSTOMER_ADMIN_DEVICE_MODELS, icon: Building2 },
      { label: 'Hợp đồng', href: ROUTES.CUSTOMER_ADMIN_CONTRACTS, icon: FileText },
      {
        label: 'Loại vật tư tiêu hao',
        href: ROUTES.CUSTOMER_ADMIN_CONSUMABLE_TYPES,
        icon: ShoppingCart,
      },
      // {
      //   label: 'Yêu cầu bảo trì',
      //   href: ROUTES.CUSTOMER_ADMIN_SERVICE_REQUESTS,
      //   icon: FileText,
      // },
      // {
      //   label: 'Yêu cầu mua hàng',
      //   href: ROUTES.CUSTOMER_ADMIN_PURCHASE_REQUESTS,
      //   icon: ShoppingCart,
      // },
      { label: 'Quản lý người dùng', href: ROUTES.CUSTOMER_ADMIN_USERS, icon: Users },
      { label: 'Khách hàng', href: ROUTES.CUSTOMER_ADMIN_CUSTOMERS, icon: Building2 },
      { label: 'Quản lý policies', href: ROUTES.CUSTOMER_ADMIN_POLICIES, icon: Shield },
      { label: 'Quản lý vai trò', href: ROUTES.CUSTOMER_ADMIN_ROLES, icon: Settings },
      { label: 'Quản lý bộ phận', href: ROUTES.CUSTOMER_ADMIN_DEPARTMENTS, icon: Building2 },
      { label: 'Cấu hình hệ thống', href: ROUTES.CUSTOMER_ADMIN_SYSTEM_SETTINGS, icon: Settings },
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
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gray-200 transition-transform duration-300 lg:static lg:translate-x-0',
          'bg-gradient-to-b from-white via-blue-50/20 to-white shadow-xl lg:shadow-lg'
        )}
      >
        {/* Logo Header - Premium Design */}
        <motion.div
          className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-0"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Animated background shapes */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 h-40 w-40 translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
            <div className="absolute bottom-0 left-0 h-32 w-32 -translate-x-1/2 translate-y-1/2 rounded-full bg-white"></div>
          </div>

          <div className="relative flex items-center justify-between gap-3 px-6 py-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <motion.div
                className="flex-shrink-0 rounded-xl border border-white/30 bg-white/20 p-2.5 shadow-lg backdrop-blur-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Printer className="h-6 w-6 text-white" />
              </motion.div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-sm font-bold text-white">MPS</h1>
                <p className="truncate text-xs font-medium text-blue-100">CHÍNH NHÂN TECHNOLOGY</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0 text-white hover:bg-white/20 lg:hidden"
              onClick={toggleSidebar}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>

        {/* Navigation - Enhanced */}
        <nav className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex-1 space-y-1.5 overflow-y-auto px-4 py-4">
          {navigation.map((item, index) => {
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

            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <SidebarNavItem item={itemWithSubmenu} index={index} />
              </motion.div>
            )
          })}
        </nav>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

        {/* Footer Section - Premium */}
        <motion.div
          className="space-y-3 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Logout Button */}
          <motion.button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition-all duration-300 hover:bg-red-50"
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1 text-left">Đăng xuất</span>
          </motion.button>

          {/* Footer Info - Premium Card */}
          <div className="rounded-lg border-2 border-gray-100 bg-white p-3">
            <div className="flex items-start gap-2">
              <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
              <div>
                <p className="text-xs font-bold text-gray-800">MPS v1.0.0</p>
                <p className="mt-0.5 text-xs text-gray-500">© 2025 Chính Nhân Technology</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.aside>
    </>
  )
}
