'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { ChevronLeft, LogOut, Printer, Zap } from 'lucide-react'
import type { Session } from '@/types/auth'
import { useUIStore } from '@/lib/store/uiStore'
import { logout } from '@/app/actions/auth'
import { useNavigation } from '@/contexts/NavigationContext'
import { SidebarNavItem } from '@/components/layout/SidebarWithSubmenu'
import * as Icons from 'lucide-react'
import { NAVIGATION_PAYLOAD } from '@/constants/navigation'
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'
import SettingsPanel from './SettingsPanel'

// Icon mapping helper - map our string icon names to lucide-react components
function getIconComponent(name?: string) {
  if (!name) return Icons.LayoutDashboard
  // Try to find the icon in lucide-react export map
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const comp = Icons[name]
  if (comp) return comp
  return Icons.LayoutDashboard
}

interface SidebarProps {
  session: Session
}

export function ModernSidebar({ session }: SidebarProps) {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { currentSubmenu } = useNavigation()

  // mark session as used to avoid unused var lint when not needed yet
  void session

  const { items: navItems, loading: navLoading } = useNavigation()

  // Build navigation list used by the sidebar. If backend hasn't returned
  // permission-checked items yet, fall back to the static payload mapped to icons.
  const navigation = (navLoading || !navItems ? NAVIGATION_PAYLOAD : navItems)
    .filter(Boolean)
    // Only include items that either are marked hasAccess === true or if not present include them (fallback)
    .map((it: Record<string, unknown>) => ({
      label: String(it.label ?? ''),
      href: (it.route as string) || '#',
      icon: getIconComponent(it.icon as string),
      badge: undefined,
      submenu: undefined,
      hasAccess: Boolean(it.hasAccess),
      raw: it,
    }))
    // If navItems is present (from backend), filter out denied items explicitly
    .filter((it: Record<string, unknown>) =>
      navItems ? (it.raw as Record<string, unknown>)?.hasAccess !== false : true
    )

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
              {/* make logo clickable to open settings */}
              <Dialog>
                <DialogTrigger asChild>
                  <motion.button
                    className="flex-shrink-0 rounded-xl border border-white/30 bg-white/20 p-2.5 shadow-lg backdrop-blur-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Mở cài đặt giao diện"
                  >
                    <Printer className="h-6 w-6 text-white" />
                  </motion.button>
                </DialogTrigger>

                <DialogContent className="max-w-lg">
                  <SettingsPanel />
                </DialogContent>
              </Dialog>

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
