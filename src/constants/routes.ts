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
  SYSTEM_ADMIN_ROLES: '/system-admin/roles',
  SYSTEM_ADMIN_DEPARTMENTS: '/system-admin/departments',
  SYSTEM_ADMIN_SETTINGS: '/system-admin/settings',

  // Customer Admin
  CUSTOMER_ADMIN: '/customer-admin',
  CUSTOMER_ADMIN_CUSTOMERS: '/customer-admin/customers',
  CUSTOMER_ADMIN_DEVICES: '/customer-admin/devices',
  CUSTOMER_ADMIN_DEVICE_MODELS: '/customer-admin/device-models',
  CUSTOMER_ADMIN_CONSUMABLE_TYPES: '/customer-admin/consumable-types',
  CUSTOMER_ADMIN_SERVICE_REQUESTS: '/customer-admin/service-requests',
  CUSTOMER_ADMIN_PURCHASE_REQUESTS: '/customer-admin/purchase-requests',

  CUSTOMER_ADMIN_POLICIES: '/customer-admin/policies',

  CUSTOMER_ADMIN_USERS: '/customer-admin/users',
  CUSTOMER_ADMIN_ROLES: '/customer-admin/roles',
  CUSTOMER_ADMIN_DEPARTMENTS: '/customer-admin/departments',
  CUSTOMER_ADMIN_REPORTS: '/customer-admin/reports',

  // User
  USER_MY_DEVICES: '/user/my-devices',
  USER_MY_REQUESTS: '/user/my-requests',
  USER_PROFILE: '/user/profile',
  USER_SETTINGS: '/user/settings',

  // Error pages
  FORBIDDEN: '/403',
  NOT_FOUND: '/404',
} as const

export type Route = (typeof ROUTES)[keyof typeof ROUTES]
