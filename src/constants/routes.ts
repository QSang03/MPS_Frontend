/**
 * Application route paths
 */
export const ROUTES = {
  // Auth
  LOGIN: '/login',

  // System Admin
  SYSTEM_ADMIN: '/system-admin',
  SYSTEM_ADMIN_CUSTOMERS: '/system-admin/customers',
  SYSTEM_ADMIN_ACCOUNTS: '/system-admin/accounts',
  SYSTEM_ADMIN_SETTINGS: '/system-admin/settings',

  // Customer Admin
  CUSTOMER_ADMIN: '/customer-admin',
  CUSTOMER_ADMIN_DEVICES: '/customer-admin/devices',
  CUSTOMER_ADMIN_SERVICE_REQUESTS: '/customer-admin/service-requests',
  CUSTOMER_ADMIN_PURCHASE_REQUESTS: '/customer-admin/purchase-requests',
  CUSTOMER_ADMIN_USERS: '/customer-admin/users',
  CUSTOMER_ADMIN_REPORTS: '/customer-admin/reports',

  // User
  USER_MY_DEVICES: '/user/my-devices',
  USER_MY_REQUESTS: '/user/my-requests',
  USER_PROFILE: '/user/profile',

  // Error pages
  FORBIDDEN: '/403',
  NOT_FOUND: '/404',
} as const

export type Route = (typeof ROUTES)[keyof typeof ROUTES]
