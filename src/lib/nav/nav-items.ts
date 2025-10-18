import { UserRole } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import {
  LayoutDashboard,
  Printer,
  FileText,
  Users,
  Settings,
  ShoppingCart,
  BarChart3,
  Building2,
  Shield,
  Briefcase,
} from 'lucide-react'

/**
 * Nav item interface
 */
export interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  roles?: UserRole[] // If no roles, all roles can see
}

/**
 * Nav group interface
 */
export interface NavGroup {
  title: string
  items: NavItem[]
}

/**
 * Navigation items configuration
 * Controls sidebar visibility only, NOT route blocking
 */
export const getNavigationItems = (userRole: UserRole): NavItem[] => {
  // All nav items with roles config
  const allNavItems: NavItem[] = [
    // System Admin routes
    {
      label: 'Khách hàng',
      href: ROUTES.SYSTEM_ADMIN_CUSTOMERS,
      icon: Building2,
      roles: [UserRole.SYSTEM_ADMIN],
    },
    {
      label: 'Tài khoản',
      href: ROUTES.SYSTEM_ADMIN_ACCOUNTS,
      icon: Users,
      roles: [UserRole.SYSTEM_ADMIN],
    },
    {
      label: 'Quản lý vai trò',
      href: ROUTES.SYSTEM_ADMIN_ROLES,
      icon: Shield,
      roles: [UserRole.SYSTEM_ADMIN],
    },
    {
      label: 'Quản lý bộ phận',
      href: ROUTES.SYSTEM_ADMIN_DEPARTMENTS,
      icon: Briefcase,
      roles: [UserRole.SYSTEM_ADMIN],
    },
    {
      label: 'Cài đặt',
      href: ROUTES.SYSTEM_ADMIN_SETTINGS,
      icon: Settings,
      roles: [UserRole.SYSTEM_ADMIN],
    },

    // Customer Admin routes
    {
      label: 'Tổng quan',
      href: ROUTES.CUSTOMER_ADMIN,
      icon: LayoutDashboard,
      roles: [UserRole.CUSTOMER_ADMIN],
    },
    {
      label: 'Thiết bị',
      href: ROUTES.CUSTOMER_ADMIN_DEVICES,
      icon: Printer,
      roles: [UserRole.CUSTOMER_ADMIN],
    },
    {
      label: 'Yêu cầu bảo trì',
      href: ROUTES.CUSTOMER_ADMIN_SERVICE_REQUESTS,
      icon: FileText,
      roles: [UserRole.CUSTOMER_ADMIN],
    },
    {
      label: 'Yêu cầu mua hàng',
      href: ROUTES.CUSTOMER_ADMIN_PURCHASE_REQUESTS,
      icon: ShoppingCart,
      roles: [UserRole.CUSTOMER_ADMIN],
    },
    {
      label: 'Người dùng',
      href: ROUTES.CUSTOMER_ADMIN_USERS,
      icon: Users,
      roles: [UserRole.CUSTOMER_ADMIN],
    },
    {
      label: 'Quản lý vai trò',
      href: ROUTES.CUSTOMER_ADMIN_ROLES,
      icon: Shield,
      roles: [UserRole.CUSTOMER_ADMIN],
    },
    {
      label: 'Quản lý bộ phận',
      href: ROUTES.CUSTOMER_ADMIN_DEPARTMENTS,
      icon: Briefcase,
      roles: [UserRole.CUSTOMER_ADMIN],
    },
    {
      label: 'Báo cáo',
      href: ROUTES.CUSTOMER_ADMIN_REPORTS,
      icon: BarChart3,
      roles: [UserRole.CUSTOMER_ADMIN],
    },

    // Regular User routes
    {
      label: 'Thiết bị của tôi',
      href: ROUTES.USER_MY_DEVICES,
      icon: Printer,
      roles: [UserRole.USER],
    },
    {
      label: 'Yêu cầu của tôi',
      href: ROUTES.USER_MY_REQUESTS,
      icon: FileText,
      roles: [UserRole.USER],
    },
    {
      label: 'Hồ sơ',
      href: ROUTES.USER_PROFILE,
      icon: Settings,
      roles: [UserRole.USER],
    },
  ]

  // Filter nav items based on user role
  return allNavItems.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true
    return item.roles.includes(userRole)
  })
}
