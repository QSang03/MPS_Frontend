'use client'

// Serializable navigation payload that will be POSTed to backend /navigation
// Icon names are strings so payload is plain JSON. UI will map icon names to components.
export type NavPermissionResource = {
  resource: string
  action: string
}

export type NavRequiredPermissions = {
  strategy: 'all' | 'any'
  resources: NavPermissionResource[]
}

export type NavActionPayload = {
  id: string
  label: string
  icon?: string
  requiredPermissions?: NavRequiredPermissions
  metadata?: Record<string, unknown>
}

export type NavItemPayload = {
  id: string
  name?: string
  label: string
  icon?: string
  route?: string
  description?: string
  requiredPermissions?: NavRequiredPermissions
  actions?: NavActionPayload[]
  metadata?: Record<string, unknown>
}

export const NAVIGATION_PAYLOAD: NavItemPayload[] = [
  {
    id: 'dashboard',
    name: 'dashboard',
    label: 'Tổng quan',
    icon: 'LayoutDashboard',
    route: '/customer-admin',
    description: 'Bảng điều khiển',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'dashboard', action: 'read' }],
    },
    actions: [],
  },
  {
    id: 'devices',
    name: 'devices',
    label: 'Thiết bị',
    icon: 'Printer',
    route: '/customer-admin/devices',
    description: 'Quản lý thiết bị',
    requiredPermissions: { strategy: 'all', resources: [{ resource: 'devices', action: 'read' }] },
    actions: [
      {
        id: 'create',
        label: 'Tạo thiết bị',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices', action: 'create' }],
        },
      },
    ],
  },
  {
    id: 'device-models',
    label: 'Mẫu thiết bị',
    icon: 'Building2',
    route: '/customer-admin/device-models',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'device-models', action: 'read' }],
    },
  },
  {
    id: 'contracts',
    label: 'Hợp đồng',
    icon: 'FileText',
    route: '/customer-admin/contracts',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'contracts', action: 'read' }],
    },
  },
  {
    id: 'consumable-types',
    label: 'Loại vật tư tiêu hao',
    icon: 'ShoppingCart',
    route: '/customer-admin/consumable-types',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'consumable-types', action: 'read' }],
    },
  },
  {
    id: 'users',
    label: 'Quản lý người dùng',
    icon: 'Users',
    route: '/customer-admin/users',
    requiredPermissions: { strategy: 'all', resources: [{ resource: 'users', action: 'read' }] },
    actions: [
      {
        id: 'create',
        label: 'Tạo mới',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'users', action: 'create' }],
        },
      },
    ],
  },
  {
    id: 'customers',
    label: 'Khách hàng',
    icon: 'Building2',
    route: '/customer-admin/customers',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'customers', action: 'read' }],
    },
  },
  {
    id: 'policies',
    label: 'Quản lý policies',
    icon: 'Shield',
    route: '/customer-admin/policies',
    requiredPermissions: { strategy: 'all', resources: [{ resource: 'policies', action: 'read' }] },
  },
  {
    id: 'roles',
    label: 'Quản lý vai trò',
    icon: 'Settings',
    route: '/customer-admin/roles',
    requiredPermissions: { strategy: 'all', resources: [{ resource: 'roles', action: 'read' }] },
  },
  {
    id: 'departments',
    label: 'Quản lý bộ phận',
    icon: 'Building2',
    route: '/customer-admin/departments',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'departments', action: 'read' }],
    },
  },
  {
    id: 'system-settings',
    label: 'Cấu hình hệ thống',
    icon: 'Settings',
    route: '/customer-admin/system-settings',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'system-settings', action: 'read' }],
    },
  },
]
