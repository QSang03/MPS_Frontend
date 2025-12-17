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
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
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
    USAGE_HISTORY: (id: string) => `/devices/${id}/usage-history`,
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

  // Warehouse Documents
  WAREHOUSE_DOCUMENTS: {
    LIST: '/warehouse-documents',
    DETAIL: (id: string) => `/warehouse-documents/${id}`,
    CREATE: '/warehouse-documents',
    UPDATE_STATUS: (id: string) => `/warehouse-documents/${id}/status`,
    CANCEL: (id: string) => `/warehouse-documents/${id}/cancel`,
  },

  // Service Requests
  SERVICE_REQUESTS: {
    LIST: '/service-requests',
    DETAIL: (id: string) => `/service-requests/${id}`,
    CREATE: '/service-requests',
    UPDATE: (id: string) => `/service-requests/${id}`,
    DELETE: (id: string) => `/service-requests/${id}`,
    STATUS: (id: string) => `/service-requests/${id}/status`,
    STATS: (customerId: string) => `/service-requests/stats/${customerId}`,
    COSTS: (id: string) => `/service-requests/${id}/costs`,
    MESSAGES: (id: string) => `/service-requests/${id}/messages`,
    ASSIGN: (id: string) => `/service-requests/${id}/assign`,
  },

  // Purchase Requests
  PURCHASE_REQUESTS: {
    BASE: '/purchase-requests',
    LIST: '/purchase-requests',
    DETAIL: (id: string) => `/purchase-requests/${id}`,
    CREATE: '/purchase-requests',
    UPDATE: (id: string) => `/purchase-requests/${id}`,
    DELETE: (id: string) => `/purchase-requests/${id}`,
    STATUS: (id: string) => `/purchase-requests/${id}/status`,
    ASSIGN: (id: string) => `/purchase-requests/${id}/assign`,
    MESSAGES: (id: string) => `/purchase-requests/${id}/messages`,
    ITEMS: (id: string) => `/purchase-requests/${id}/items`,
  },

  // Service Level Agreements
  SLAS: {
    LIST: '/slas',
    DETAIL: (id: string) => `/slas/${id}`,
    CREATE: '/slas',
    UPDATE: (id: string) => `/slas/${id}`,
    DELETE: (id: string) => `/slas/${id}`,
  },

  // SLA Templates
  SLA_TEMPLATES: {
    LIST: '/sla-templates',
    DETAIL: (id: string) => `/sla-templates/${id}`,
    CREATE: '/sla-templates',
    UPDATE: (id: string) => `/sla-templates/${id}`,
    DELETE: (id: string) => `/sla-templates/${id}`,
    APPLY: (id: string) => `/sla-templates/${id}/apply`,
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
    INVOICES: {
      LIST: '/reports/invoices',
      CREATE: '/reports/invoices',
      DETAIL: (id: string) => `/reports/invoices/${id}`,
    },
  },
  // Policies
  POLICIES: '/policies',
  RESOURCE_TYPES: '/resource-types',
  POLICY_OPERATORS: '/policy-operators',
  POLICY_CONDITIONS: '/policy-conditions',
  POLICY_ASSISTANT: {
    BLUEPRINT: (role: string) => `/policies/assistant/blueprint/${encodeURIComponent(role)}`,
    ANALYZE: '/policies/assistant/analyze',
    CHAT: '/policies/assistant/chat',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
  },

  // Currencies
  CURRENCIES: {
    LIST: '/currencies',
    DETAIL: (id: string) => `/currencies/${id}`,
  },

  // Exchange Rates
  EXCHANGE_RATES: {
    LIST: '/exchange-rates',
    DETAIL: (id: string) => `/exchange-rates/${id}`,
    CREATE: '/exchange-rates',
    UPDATE: (id: string) => `/exchange-rates/${id}`,
    DELETE: (id: string) => `/exchange-rates/${id}`,
    CONVERT: '/exchange-rates/convert',
  },

  // Cost Adjustments
  COST_ADJUSTMENTS: {
    LIST: '/cost-adjustments',
    DETAIL: (id: string) => `/cost-adjustments/${id}`,
  },

  // Maintenance Histories
  MAINTENANCE_HISTORIES: {
    LIST: '/maintenance-histories',
    DETAIL: (id: string) => `/maintenance-histories/${id}`,
    CREATE: '/maintenance-histories',
    UPDATE: (id: string) => `/maintenance-histories/${id}`,
    DELETE: (id: string) => `/maintenance-histories/${id}`,
    BY_DEVICE: (deviceId: string) => `/maintenance-histories/devices/${deviceId}`,
    CREATE_BY_DEVICE: (deviceId: string) => `/maintenance-histories/devices/${deviceId}`,
  },

  // Navigation Config
  NAVIGATION_CONFIG: {
    LIST: '/navigation-config',
    DETAIL: (id: string) => `/navigation-config/${id}`,
    CREATE: '/navigation-config',
    UPDATE: (id: string) => `/navigation-config/${id}`,
    DELETE: (id: string) => `/navigation-config/${id}`,
    BY_NAME: (name: string) => `/navigation-config/name/${encodeURIComponent(name)}`,
  },
} as const
