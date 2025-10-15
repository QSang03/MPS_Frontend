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
  },

  // Users
  USERS: '/users',

  // Roles
  ROLES: '/roles',

  // Departments
  DEPARTMENTS: '/departments',

  // Customers
  CUSTOMERS: '/customers',

  // Devices
  DEVICES: {
    LIST: '/devices',
    DETAIL: (id: string) => `/devices/${id}`,
    CREATE: '/devices',
    UPDATE: (id: string) => `/devices/${id}`,
    DELETE: (id: string) => `/devices/${id}`,
    STATS: (customerId: string) => `/devices/stats/${customerId}`,
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
  },
} as const
