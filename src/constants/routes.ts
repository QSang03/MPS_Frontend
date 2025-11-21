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

  // Customer Admin
  CUSTOMER_ADMIN: '/system',
  CUSTOMER_ADMIN_CUSTOMERS: '/system/customers',
  CUSTOMER_ADMIN_DEVICES: '/system/devices',
  CUSTOMER_ADMIN_DEVICE_MODELS: '/system/device-models',
  CUSTOMER_ADMIN_CONSUMABLE_TYPES: '/system/consumable-types',
  CUSTOMER_ADMIN_SERVICE_REQUESTS: '/system/service-requests',
  CUSTOMER_ADMIN_REQUESTS: '/system/requests',
  CUSTOMER_ADMIN_PURCHASE_REQUESTS: '/system/purchase-requests',

  CUSTOMER_ADMIN_POLICIES: '/system/policies',

  CUSTOMER_ADMIN_USERS: '/system/users',
  CUSTOMER_ADMIN_ROLES: '/system/roles',
  CUSTOMER_ADMIN_DEPARTMENTS: '/system/departments',
  CUSTOMER_ADMIN_SYSTEM_SETTINGS: '/system/system-settings',
  CUSTOMER_ADMIN_REPORTS: '/system/reports',

  // User
  USER_MY_DEVICES: '/user/devices',
  USER_DASHBOARD: '/user/dashboard',
  USER_MY_REQUESTS: '/user/my-requests',
  USER_PROFILE: '/user/profile',
  USER_SETTINGS: '/user/settings',

  // Error pages
  FORBIDDEN: '/403',
  NOT_FOUND: '/404',
} as const

export type Route = (typeof ROUTES)[keyof typeof ROUTES]
