import { ROUTES } from '@/constants/routes'
import { Home, Users, ClipboardList, Layout, Settings, Layers } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  badge?: number
}

export function getNavigationItems(_role?: string): NavItem[] {
  // Temporary: show roles and departments to everyone. We'll refine by role later.
  const items: NavItem[] = [
    { href: ROUTES.CUSTOMER_ADMIN, label: 'Dashboard', icon: Home },
    { href: ROUTES.CUSTOMER_ADMIN_USERS, label: 'Quản lý người dùng', icon: Users },
    { href: ROUTES.CUSTOMER_ADMIN_ROLES, label: 'Quản lý vai trò', icon: Layers },
    { href: ROUTES.CUSTOMER_ADMIN_DEPARTMENTS, label: 'Quản lý bộ phận', icon: ClipboardList },
    { href: ROUTES.CUSTOMER_ADMIN_DEVICES, label: 'Thiết bị', icon: Layout },
    { href: ROUTES.CUSTOMER_ADMIN_DEVICE_MODELS, label: 'Mẫu thiết bị', icon: Layers },
    { href: ROUTES.CUSTOMER_ADMIN_REPORTS, label: 'Báo cáo', icon: Settings },
  ]

  // Debug: log role and items so we can confirm this function is called in the client
  try {
    // This will appear in the browser console (client-side)

    console.debug(
      '[nav-items] getNavigationItems called with role:',
      _role,
      'returning items:',
      items.map((i) => i.label)
    )
  } catch {
    /* ignore */
  }

  return items
}

export type { NavItem }
