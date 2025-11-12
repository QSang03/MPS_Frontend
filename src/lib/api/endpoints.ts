/**
 * API endpoint constants
 */
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/signin',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/profile',
    CHANGE_PASSWORD: '/auth/change-password',
  },

  // Users
  USERS: '/users',

  // Roles
  ROLES: '/roles',

  // Departments
  DEPARTMENTS: '/departments',

  // Customers
  CUSTOMERS: '/customers',
  // Contracts
  CONTRACTS: '/contracts',

  // Devices
  DEVICES: {
    LIST: '/devices',
    DETAIL: (id: string) => `/devices/${id}`,
    CREATE: '/devices',
    UPDATE: (id: string) => `/devices/${id}`,
    DELETE: (id: string) => `/devices/${id}`,
    STATS: (customerId: string) => `/devices/stats/${customerId}`,
    ASSIGN_TO_CUSTOMER: (id: string) => `/devices/${id}/assign-to-customer`,
    RETURN_TO_WAREHOUSE: (id: string) => `/devices/${id}/return-to-warehouse`,
  },

  // Device Models
  DEVICE_MODELS: {
    LIST: '/device-models',
    DETAIL: (id: string) => `/device-models/${id}`,
    CREATE: '/device-models',
    UPDATE: (id: string) => `/device-models/${id}`,
    DELETE: (id: string) => `/device-models/${id}`,
    COMPATIBLE_CONSUMABLES: (id: string) => `/device-models/${id}/compatible-consumables`,
  },

  // Consumable Types
  CONSUMABLE_TYPES: {
    LIST: '/consumable-types',
    DETAIL: (id: string) => `/consumable-types/${id}`,
    CREATE: '/consumable-types',
    UPDATE: (id: string) => `/consumable-types/${id}`,
    DELETE: (id: string) => `/consumable-types/${id}`,
  },

  // Consumables
  CONSUMABLES: {
    LIST: '/consumables',
    DETAIL: (id: string) => `/consumables/${id}`,
    BULK_CREATE: '/consumables/bulk-create',
  },

  // Stock Items
  STOCK_ITEMS: {
    UPDATE: (id: string) => `/stock-items/${id}`,
    MOVEMENTS: (id: string) => `/stock-items/${id}/movements`,
  },

  // Service Requests
  SERVICE_REQUESTS: {
    LIST: '/service-requests',
    DETAIL: (id: string) => `/service-requests/${id}`,
    CREATE: '/service-requests',
    UPDATE: (id: string) => `/service-requests/${id}`,
    DELETE: (id: string) => `/service-requests/${id}`,
    STATS: (customerId: string) => `/service-requests/stats/${customerId}`,
  },

  // Purchase Requests
  PURCHASE_REQUESTS: {
    LIST: '/purchase-requests',
    DETAIL: (id: string) => `/purchase-requests/${id}`,
    CREATE: '/purchase-requests',
    UPDATE: (id: string) => `/purchase-requests/${id}`,
    DELETE: (id: string) => `/purchase-requests/${id}`,
  },

  // Usage Logs
  USAGE_LOGS: {
    LIST: '/usage-logs',
    DETAIL: (id: string) => `/usage-logs/${id}`,
    BY_DEVICE: (deviceId: string) => `/usage-logs/device/${deviceId}`,
    TREND: (customerId: string) => `/usage-logs/trend/${customerId}`,
  },

  // Reports
  REPORTS: {
    LIST: '/reports',
    GENERATE: '/reports/generate',
    DOWNLOAD: (id: string) => `/reports/${id}/download`,
    USAGE_PAGES_MONTHLY: '/reports/usage/pages/monthly',
  },
  // Policies
  POLICIES: '/policies',
  RESOURCE_TYPES: '/resource-types',
  POLICY_OPERATORS: '/policy-operators',
  POLICY_CONDITIONS: '/policy-conditions',
} as const
