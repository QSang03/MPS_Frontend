'use client'

import { useEffect } from 'react'
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
import { NAVIGATION_PAYLOAD, USER_NAVIGATION_PAYLOAD } from '@/constants/navigation'
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
  const { sidebarOpen, toggleSidebar, openSidebar, closeSidebar } = useUIStore()

  // Ensure sidebar state follows viewport size so it doesn't remain hidden
  // due to persisted state when resizing between mobile <-> desktop.
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024
      if (isDesktop) {
        openSidebar()
      } else {
        closeSidebar()
      }
    }

    // Run once to sync initial state
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [openSidebar, closeSidebar])
  const { currentSubmenu } = useNavigation()

  const isUserRole = String(session.role ?? '').toLowerCase() === 'user'
  const roleBasedFallback = isUserRole ? USER_NAVIGATION_PAYLOAD : NAVIGATION_PAYLOAD

  const { items: navItems, loading: navLoading } = useNavigation()

  // Build navigation list used by the sidebar.
  // Important behaviour:
  // - While nav is loading, don't render the static NAVIGATION_PAYLOAD (avoid briefly showing items the user may not have access to).
  // - If backend returns permission-checked `navItems`, use them directly (items and actions already filtered in NavigationContext).
  // - If backend finished loading but returned no navItems (null/undefined), fall back to role-based items.
  const source = navLoading
    ? []
    : (navItems ?? (roleBasedFallback as unknown as Array<Record<string, unknown>>))

  const navigation = (source as Array<Record<string, unknown>>)
    .filter(Boolean)
    // Items from backend are already filtered in NavigationContext (hasAccess === false items and actions are removed)
    // So we can use them directly without additional filtering
    .map((it) => ({
      label: String(it.label ?? ''),
      href: (it.route as string) || (it.href as string) || '#',
      icon: getIconComponent(it.icon as string),
      badge: undefined,
      submenu: undefined,
      raw: it,
    }))

  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('mps_navigation')
      }
    } catch {
      // ignore
    }
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
          'fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col border-r border-gray-200 transition-transform duration-300 lg:static lg:translate-x-0',
          'bg-white shadow-xl lg:shadow-none'
        )}
      >
        {/* Logo Header - Minimal Design */}
        <motion.div
          className="relative overflow-hidden border-b border-gray-100 bg-white p-0"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative flex items-center justify-between gap-3 px-6 py-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {/* make logo clickable to open settings */}
              <Dialog>
                <DialogTrigger asChild>
                  <motion.button
                    className="flex-shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-2.5 shadow-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Mở cài đặt giao diện"
                  >
                    <Printer className="h-6 w-6 text-blue-600" />
                  </motion.button>
                </DialogTrigger>

                <DialogContent className="max-w-lg">
                  <SettingsPanel />
                </DialogContent>
              </Dialog>

              <div className="min-w-0 flex-1">
                <h1 className="truncate text-sm font-bold text-slate-900">MPS</h1>
                <p className="truncate text-xs font-medium text-slate-500">CHÍNH NHÂN TECHNOLOGY</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0 text-slate-500 hover:bg-slate-100 lg:hidden"
              onClick={toggleSidebar}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>

        {/* Navigation - Enhanced with grouping */}
        <nav className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex-1 overflow-y-auto px-4 py-4">
          {(() => {
            // Group items by semantic section based on route prefix
            type Item = {
              label: string
              href: string
              icon: React.ComponentType<{ className?: string }>
              badge?: number
              submenu?: unknown
            }

            // System sections (admin)
            const systemSections: {
              key: string
              title: string
              matcher: (href: string) => boolean
            }[] = [
              { key: 'overview', title: 'Tổng quan', matcher: (h) => h === '/system' },
              {
                key: 'devices',
                title: 'Thiết bị',
                matcher: (h) =>
                  h.startsWith('/system/devices') || h.startsWith('/system/device-models'),
              },
              {
                key: 'consumables',
                title: 'Vật tư',
                matcher: (h) =>
                  h.startsWith('/system/consumables') || h.startsWith('/system/consumable-types'),
              },
              {
                key: 'customers',
                title: 'Khách hàng',
                matcher: (h) => h.startsWith('/system/customers'),
              },
              {
                key: 'reports',
                title: 'Báo cáo',
                matcher: (h) => h.startsWith('/system/reports') || h.startsWith('/system/revenue'),
              },
            ]

            // User sections
            const userSections: {
              key: string
              title: string
              matcher: (href: string) => boolean
            }[] = [
              { key: 'overview', title: 'Tổng quan', matcher: (h) => h === '/user/dashboard' },
              {
                key: 'costs',
                title: 'Chi phí',
                matcher: (h) =>
                  h.startsWith('/user/dashboard/costs') || h.startsWith('/user/costs'),
              },
              { key: 'devices', title: 'Thiết bị', matcher: (h) => h.startsWith('/user/devices') },
              {
                key: 'consumables',
                title: 'Vật tư tiêu hao',
                matcher: (h) => h.startsWith('/user/consumables'),
              },
              {
                key: 'contracts',
                title: 'Hợp đồng',
                matcher: (h) => h.startsWith('/user/contracts'),
              },
              { key: 'users', title: 'Người dùng', matcher: (h) => h.startsWith('/user/users') },
            ]

            // Prefer user sections when session role is 'user' OR when the navigation contains /user routes.
            const hasUserRoutes = navigation.some(
              (n) => typeof n.href === 'string' && (n.href as string).startsWith('/user')
            )
            const sections = isUserRole || hasUserRoutes ? userSections : systemSections
            const grouped = new Map<string, Item[]>()
            const otherKey = 'others'
            const getSectionKey = (href: string) => {
              const found = sections.find((s) => s.matcher(href))
              return found ? found.key : otherKey
            }
            navigation.forEach((item) => {
              const key = getSectionKey(item.href)
              const arr = grouped.get(key) ?? []
              arr.push(item as unknown as Item)
              grouped.set(key, arr)
            })
            const orderedKeys = [...sections.map((s) => s.key), otherKey].filter((k) =>
              grouped.has(k)
            )
            let renderIndex = 0
            return orderedKeys.map((key) => {
              const title = sections.find((s) => s.key === key)?.title ?? 'Khác'
              const items = grouped.get(key) ?? []
              return (
                <div key={key} className="mb-4">
                  <div className="text-muted-foreground mb-2 px-2 text-xs font-medium tracking-wider uppercase">
                    {title}
                  </div>
                  <div className="space-y-1.5">
                    {items.map((item) => {
                      const itemWithSubmenu = {
                        ...item,
                        submenu:
                          item.href === '/system/devices' &&
                          currentSubmenu?.href.includes('/devices/')
                            ? [currentSubmenu]
                            : item.href === '/system/service-requests' &&
                                currentSubmenu?.href.includes('/service-requests/')
                              ? [currentSubmenu]
                              : item.href === '/system/purchase-requests' &&
                                  currentSubmenu?.href.includes('/purchase-requests/')
                                ? [currentSubmenu]
                                : item.href === '/system/users' &&
                                    currentSubmenu?.href.includes('/users/')
                                  ? [currentSubmenu]
                                  : undefined,
                      }
                      const myIndex = renderIndex++
                      return (
                        <motion.div
                          key={item.href}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: myIndex * 0.05 }}
                        >
                          <SidebarNavItem item={itemWithSubmenu} index={myIndex} />
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          })()}
        </nav>

        {/* Divider */}
        <div className="h-px bg-slate-100" />

        {/* Footer Section - Minimal */}
        <motion.div
          className="space-y-3 border-t border-slate-100 bg-white p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Logout Button */}
          <motion.button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:text-red-600"
            whileHover={{ scale: 1.01, x: 2 }}
            whileTap={{ scale: 0.99 }}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1 text-left">Đăng xuất</span>
          </motion.button>

          {/* Footer Info - Minimal Card */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
            <div className="flex items-start gap-2">
              <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
              <div>
                <p className="text-xs font-bold text-slate-800">MPS v1.0.0</p>
                <p className="mt-0.5 text-xs text-slate-500">© 2025 Chính Nhân Technology</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.aside>
    </>
  )
}
