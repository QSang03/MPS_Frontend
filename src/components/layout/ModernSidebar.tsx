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
import {
  LayoutDashboard,
  BarChart3,
  ShoppingCart,
  Package,
  FileText,
  Users,
  Settings,
  Plus,
  Edit,
  Trash2,
  Filter,
  UserPlus,
  Tag,
  Bell,
  Eye,
  Building2,
  Layers,
  Wrench,
  ClipboardCheck,
  Shield,
  MonitorSmartphone,
  Upload,
  Calculator,
} from 'lucide-react'
import { NAVIGATION_PAYLOAD, USER_NAVIGATION_PAYLOAD } from '@/constants/navigation'
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'
import SettingsPanel from './SettingsPanel'
import { useLocale } from '@/components/providers/LocaleProvider'

// Icon mapping - map string icon names to lucide-react components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Printer,
  BarChart3,
  ShoppingCart,
  Package,
  FileText,
  Users,
  Settings,
  Plus,
  Edit,
  Edit2: Edit,
  Trash2,
  Filter,
  UserPlus,
  Tag,
  Bell,
  Eye,
  Building2,
  Layers,
  Wrench,
  ClipboardCheck,
  Shield,
  MonitorSmartphone,
  Zap,
  Upload,
  Calculator,
}

// Icon mapping helper - map our string icon names to lucide-react components
function getIconComponent(name?: string): React.ComponentType<{ className?: string }> {
  if (!name) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[ModernSidebar] No icon name provided, using LayoutDashboard`)
    }
    return LayoutDashboard
  }

  const iconName = String(name).trim()

  // First, try the explicit mapping
  if (ICON_MAP[iconName]) {
    return ICON_MAP[iconName]
  }

  // Then, try to find the icon in lucide-react export map
  const comp = (Icons as Record<string, unknown>)[iconName]
  if (comp && typeof comp === 'function') {
    return comp as React.ComponentType<{ className?: string }>
  }

  // If not found, log warning and return default
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[ModernSidebar] Icon "${iconName}" not found, using LayoutDashboard as fallback`)
    console.log(`[ModernSidebar] Available icons in map:`, Object.keys(ICON_MAP))
  }

  return LayoutDashboard
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
  const { t } = useLocale()

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

  // Create a map of fallback items by id/route for icon lookup
  const fallbackMap = new Map<string, Record<string, unknown>>()
  const fallbackByRoute = new Map<string, Record<string, unknown>>()
  ;(roleBasedFallback as Array<Record<string, unknown>>).forEach((item) => {
    const id = item.id as string
    const route = (item.route as string) || (item.href as string)
    if (id) fallbackMap.set(id, item)
    if (route) {
      fallbackMap.set(route, item)
      fallbackByRoute.set(route, item)
      // Also add route without leading slash for matching
      if (route.startsWith('/')) {
        fallbackByRoute.set(route.substring(1), item)
      }
    }
  })

  const navigation = (source as Array<Record<string, unknown>>)
    .filter(Boolean)
    // Items from backend are already filtered in NavigationContext (hasAccess === false items and actions are removed)
    // So we can use them directly without additional filtering
    .map((it) => {
      const navId = it?.id as string
      const navName = it?.name as string
      const navLabel = it?.label as string
      const navRoute = (it.route as string) || (it.href as string) || '#'

      // Try to get icon from backend item first, then fallback to payload
      let iconName = it.icon as string | undefined
      if (!iconName) {
        // Try to find icon from fallback payload by id first, then by route
        let fallbackItem = fallbackMap.get(navId)
        if (!fallbackItem && navRoute) {
          fallbackItem = fallbackMap.get(navRoute) || fallbackByRoute.get(navRoute)
          // Also try matching route without leading slash
          if (!fallbackItem && navRoute.startsWith('/')) {
            fallbackItem = fallbackByRoute.get(navRoute.substring(1))
          }
        }

        if (fallbackItem) {
          iconName = fallbackItem.icon as string | undefined
        } else {
          // Last resort: search in entire fallback array by matching route or id
          const found = (roleBasedFallback as Array<Record<string, unknown>>).find((item) => {
            const itemRoute = (item.route as string) || (item.href as string)
            return item.id === navId || itemRoute === navRoute
          })
          if (found) {
            iconName = found.icon as string | undefined
          }
        }
      }

      // Debug: log icon resolution in development
      if (process.env.NODE_ENV === 'development') {
        if (!iconName) {
          console.warn(`[ModernSidebar] No icon found for item:`, {
            id: navId,
            name: navName,
            route: navRoute,
            backendIcon: it.icon,
          })
        } else {
          console.log(`[ModernSidebar] Icon resolved:`, {
            id: navId,
            iconName,
            fromBackend: !!it.icon,
          })
        }
      }

      // Try to get translation by id first, then by name, then fallback to label
      let translatedLabel = ''
      if (navId) {
        const key = `nav.${navId}`
        const translated = t(key)
        if (translated !== key) {
          translatedLabel = translated
        }
      }
      if (!translatedLabel && navName) {
        const key = `nav.${navName}`
        const translated = t(key)
        if (translated !== key) {
          translatedLabel = translated
        }
      }
      if (!translatedLabel && typeof navLabel === 'string') {
        translatedLabel = navLabel
      }
      // Ensure we always have an icon - use fallback if needed
      const finalIcon = getIconComponent(iconName)

      return {
        label: translatedLabel,
        href: navRoute,
        icon: finalIcon,
        badge: undefined,
        submenu: undefined,
        raw: it,
      }
    })

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
                    aria-label={t('settings.open')}
                  >
                    <Printer className="h-6 w-6 text-[var(--brand-600)]" />
                  </motion.button>
                </DialogTrigger>

                <DialogContent className="max-w-lg">
                  <SettingsPanel />
                </DialogContent>
              </Dialog>

              <div className="min-w-0 flex-1">
                <h1 className="truncate text-sm font-bold text-slate-900">
                  {t('sidebar.logo.title')}
                </h1>
                <p className="truncate text-xs font-medium text-slate-500">
                  {t('sidebar.logo.subtitle')}
                </p>
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
              { key: 'overview', title: t('nav.overview'), matcher: (h) => h === '/system' },
              {
                key: 'devices',
                title: t('nav.devices'),
                matcher: (h) =>
                  h.startsWith('/system/devices') || h.startsWith('/system/device-models'),
              },
              {
                key: 'consumables',
                title: t('nav.consumables'),
                matcher: (h) =>
                  h.startsWith('/system/consumables') ||
                  h.startsWith('/system/consumable-types') ||
                  h.startsWith('/system/warehouse-documents'),
              },
              {
                key: 'customers',
                title: t('nav.customers'),
                matcher: (h) => h.startsWith('/system/customers'),
              },
              {
                key: 'reports',
                title: t('nav.reports'),
                matcher: (h) => h.startsWith('/system/reports') || h.startsWith('/system/revenue'),
              },
            ]

            // User sections
            const userSections: {
              key: string
              title: string
              matcher: (href: string) => boolean
            }[] = [
              {
                key: 'overview',
                title: t('nav.overview'),
                matcher: (h) => h === '/user/dashboard',
              },
              {
                key: 'costs',
                title: t('nav.costs'),
                matcher: (h) =>
                  h.startsWith('/user/dashboard/costs') || h.startsWith('/user/costs'),
              },
              {
                key: 'devices',
                title: t('nav.devices'),
                matcher: (h) => h.startsWith('/user/devices'),
              },
              {
                key: 'consumables',
                title: t('nav.consumables'),
                matcher: (h) =>
                  h.startsWith('/user/consumables') || h.startsWith('/user/warehouse-documents'),
              },
              {
                key: 'contracts',
                title: t('nav.contracts'),
                matcher: (h) => h.startsWith('/user/contracts'),
              },
              { key: 'users', title: t('nav.users'), matcher: (h) => h.startsWith('/user/users') },
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
              const sectionMeta = sections.find((s) => s.key === key)
              const title = sectionMeta?.title ?? t(`nav.${key}`)
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
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:text-[var(--color-error-500)]"
            whileHover={{ scale: 1.01, x: 2 }}
            whileTap={{ scale: 0.99 }}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1 text-left">{t('logout')}</span>
          </motion.button>

          {/* Footer Info - Minimal Card */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
            <div className="flex items-start gap-2">
              <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--warning-500)]" />
              <div>
                <p className="text-xs font-bold text-slate-800">{t('footer.version')}</p>
                <p className="mt-0.5 text-xs text-slate-500">{t('footer.copyright')}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.aside>
    </>
  )
}
