'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Printer, UserCircle } from 'lucide-react'
import type { Session } from '@/lib/auth/session'
import { useUIStore } from '@/lib/store/uiStore'
import { NAVIGATION_PAYLOAD, USER_NAVIGATION_PAYLOAD } from '@/constants/navigation'
import { useNavigation } from '@/contexts/NavigationContext'
import * as Icons from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import type { ComponentType } from 'react'
import { Layers, ClipboardList } from 'lucide-react'

interface SidebarProps {
  session: Session
}

export function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useUIStore()

  const isUserRole = String(session.role ?? '').toLowerCase() === 'user'
  const payload = isUserRole ? USER_NAVIGATION_PAYLOAD : NAVIGATION_PAYLOAD
  const navigationFromConfig = (payload || []).map((it: Record<string, unknown>) => ({
    href: (it.route as string as string) || (it.href as string as string) || '#',
    label: String(it.label ?? ''),
    icon: getIconComponent(it.icon as string),
    badge: undefined,
    raw: it as unknown as Record<string, unknown>,
  }))
  // Try to use navigation items computed by the backend (permission-checked)
  const { items: navItems, loading: navLoading } = useNavigation()

  // Icon mapping helper - map our string icon names to lucide-react components
  type IconComp = ComponentType<Record<string, unknown>>
  const getIconComponent = (name?: string): IconComp => {
    if (!name) return Icons.LayoutDashboard as unknown as IconComp
    const comp = (Icons as unknown as Record<string, IconComp>)[name]
    if (comp) return comp
    return Icons.LayoutDashboard as unknown as IconComp
  }

  // Build navigation list; prefer backend-provided `navItems` when available
  type SidebarNavItem = {
    href: string
    label: string
    icon: ComponentType<{ className?: string }>
    badge?: number
    raw?: Record<string, unknown>
  }

  const navigation: SidebarNavItem[] =
    navLoading || !navItems
      ? // cast static items into SidebarNavItem shape
        (navigationFromConfig as unknown as SidebarNavItem[])
      : (navItems || [])
          // Items from backend are already filtered in NavigationContext (hasAccess === false items and actions are removed)
          // So we can use them directly without additional filtering
          .map((it) => {
            const item = it as unknown as Record<string, unknown>
            return {
              href: (item.route as string) || (item.href as string) || '#',
              label: String(item.label ?? ''),
              icon: getIconComponent(item.icon as string),
              badge: undefined,
              // keep raw for any downstream use
              raw: item,
            }
          })
  try {
    // Only apply static fallbacks when backend navigation is not available.
    // If backend provided `navItems`, we must respect its hasAccess flags and
    // not re-insert items that were explicitly denied.
    if (navLoading || !navItems) {
      if (!navigation.some((it) => it.href === ROUTES.CUSTOMER_ADMIN_ROLES)) {
        navigation.push({
          href: ROUTES.CUSTOMER_ADMIN_ROLES,
          label: 'Quản lý vai trò',
          icon: Layers,
        })
      }
      if (!navigation.some((it) => it.href === ROUTES.CUSTOMER_ADMIN_DEPARTMENTS)) {
        navigation.push({
          href: ROUTES.CUSTOMER_ADMIN_DEPARTMENTS,
          label: 'Quản lý bộ phận',
          icon: ClipboardList,
        })
      }

      // Ensure Device Models visible to all roles: insert after Thiết bị if possible
      if (!navigation.some((it) => it.href === ROUTES.CUSTOMER_ADMIN_DEVICE_MODELS)) {
        const deviceIndex = navigation.findIndex((it) => it.href === ROUTES.CUSTOMER_ADMIN_DEVICES)
        const item: SidebarNavItem = {
          href: ROUTES.CUSTOMER_ADMIN_DEVICE_MODELS,
          label: 'Mẫu thiết bị',
          icon: Layers,
        }
        if (deviceIndex >= 0 && deviceIndex < navigation.length - 1) {
          navigation.splice(deviceIndex + 1, 0, item)
        } else {
          navigation.push(item)
        }
      }
    }

    console.debug(
      '[Sidebar] navigation items:',
      navigation.map((i) => i.label)
    )
  } catch {
    /* ignore */
  }

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
              <span className="text-xl font-bold">MPS - CHÍNH NHÂN TECHNOLOGY</span>
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
                item.href === '/system'
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
