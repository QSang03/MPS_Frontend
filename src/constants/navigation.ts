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

// User navigation payload - simple, no permissions required
export const USER_NAVIGATION_PAYLOAD: NavItemPayload[] = [
  {
    id: 'user-dashboard',
    name: 'dashboard',
    label: 'Tổng quan',
    icon: 'LayoutDashboard',
    route: '/user/dashboard',
    description: 'Tổng quan',
    actions: [
      {
        id: 'read',
        label: 'Xem tổng quan',
        icon: 'Eye',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'dashboard', action: 'read' }],
        },
      },
    ],
  },
  {
    id: 'user-devices',
    name: 'devices',
    label: 'Thiết bị',
    icon: 'Printer',
    route: '/user/devices',
    description: 'Thiết bị của tôi',
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
      {
        id: 'update',
        label: 'Chỉnh sửa thiết bị',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices', action: 'update' }],
        },
      },
      {
        id: 'delete',
        label: 'Xóa thiết bị',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices', action: 'delete' }],
        },
      },
      {
        id: 'filter-by-customer',
        label: 'Lọc theo khách hàng',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'customers', action: 'read' }],
        },
      },
    ],
  },
  {
    id: 'user-contracts',
    name: 'contracts',
    label: 'Hợp đồng',
    icon: 'FileText',
    route: '/user/contracts',
    description: 'Hợp đồng của tôi',
    actions: [
      {
        id: 'create',
        label: 'Tạo hợp đồng',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'contracts', action: 'create' }],
        },
      },
      {
        id: 'update',
        label: 'Chỉnh sửa hợp đồng',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'contracts', action: 'update' }],
        },
      },
      {
        id: 'delete',
        label: 'Xóa hợp đồng',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'contracts', action: 'delete' }],
        },
      },
      {
        id: 'filter-by-customer',
        label: 'Lọc theo khách hàng',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'customers', action: 'read' }],
        },
      },
      {
        id: 'filter-by-type',
        label: 'Lọc theo loại hợp đồng',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'contracts', action: 'read' }],
        },
      },
    ],
  },
]

// Admin navigation payload - requires permissions
export const NAVIGATION_PAYLOAD: NavItemPayload[] = [
  {
    id: 'dashboard',
    name: 'dashboard',
    label: 'Tổng quan',
    icon: 'LayoutDashboard',
    route: '/system',
    description: 'Bảng điều khiển',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'dashboard', action: 'read' }],
    },
    actions: [],
  },
  {
    id: 'revenue',
    label: 'Doanh thu',
    icon: 'BarChart3',
    route: '/system/revenue',
    description: 'Báo cáo doanh thu theo thiết bị và theo tháng',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'reports', action: 'read' }],
    },
    actions: [],
  },
  {
    id: 'devices',
    name: 'devices',
    label: 'Thiết bị',
    icon: 'Printer',
    route: '/system/devices',
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
      {
        id: 'update',
        label: 'Chỉnh sửa thiết bị',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices', action: 'update' }],
        },
      },
      {
        id: 'delete',
        label: 'Xóa thiết bị',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices', action: 'delete' }],
        },
      },
      {
        id: 'filter-by-customer',
        label: 'Lọc theo khách hàng',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'customers', action: 'read' }],
        },
      },
    ],
  },
  {
    id: 'device-models',
    label: 'Mẫu thiết bị',
    icon: 'Building2',
    route: '/system/device-models',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'device-models', action: 'read' }],
    },
    actions: [
      {
        id: 'create',
        label: 'Tạo mẫu thiết bị',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'device-models', action: 'create' }],
        },
      },
      {
        id: 'update',
        label: 'Chỉnh sửa mẫu',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'device-models', action: 'update' }],
        },
      },
      {
        id: 'delete',
        label: 'Xóa mẫu',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'device-models', action: 'delete' }],
        },
      },
      {
        id: 'filter-by-manufacturer',
        label: 'Lọc theo hãng',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'device-models', action: 'read' }],
        },
      },
      {
        id: 'filter-by-type',
        label: 'Lọc theo loại',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'device-models', action: 'read' }],
        },
      },
    ],
  },
  {
    id: 'contracts',
    label: 'Hợp đồng',
    icon: 'FileText',
    route: '/system/contracts',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'contracts', action: 'read' }],
    },
    actions: [
      {
        id: 'create',
        label: 'Tạo hợp đồng',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'contracts', action: 'create' }],
        },
      },
      {
        id: 'update',
        label: 'Chỉnh sửa hợp đồng',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'contracts', action: 'update' }],
        },
      },
      {
        id: 'delete',
        label: 'Xóa hợp đồng',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'contracts', action: 'delete' }],
        },
      },
      {
        id: 'filter-by-customer',
        label: 'Lọc theo khách hàng',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'customers', action: 'read' }],
        },
      },
      {
        id: 'filter-by-type',
        label: 'Lọc theo loại hợp đồng',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'contracts', action: 'read' }],
        },
      },
    ],
  },
  {
    id: 'consumable-types',
    label: 'Loại vật tư tiêu hao',
    icon: 'ShoppingCart',
    route: '/system/consumable-types',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'consumable-types', action: 'read' }],
    },
    actions: [
      {
        id: 'create',
        label: 'Tạo loại vật tư',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'consumable-types', action: 'create' }],
        },
      },
      {
        id: 'update',
        label: 'Chỉnh sửa loại vật tư',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'consumable-types', action: 'update' }],
        },
      },
      {
        id: 'delete',
        label: 'Xóa loại vật tư',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'consumable-types', action: 'delete' }],
        },
      },
      {
        id: 'filter-by-category',
        label: 'Lọc theo danh mục',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'consumable-types', action: 'read' }],
        },
      },
    ],
  },
  {
    id: 'users',
    label: 'Quản lý người dùng',
    icon: 'Users',
    route: '/system/users',
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
      {
        id: 'update',
        label: 'Chỉnh sửa người dùng',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'users', action: 'update' }],
        },
      },
      {
        id: 'delete',
        label: 'Xóa người dùng',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'users', action: 'delete' }],
        },
      },
      {
        id: 'filter-by-role',
        label: 'Lọc theo vai trò',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'roles', action: 'read' }],
        },
      },
      {
        id: 'filter-by-department',
        label: 'Lọc theo bộ phận',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'departments', action: 'read' }],
        },
      },
      {
        id: 'filter-by-customer',
        label: 'Lọc theo khách hàng',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'customers', action: 'read' }],
        },
      },
    ],
  },
  {
    id: 'customers',
    label: 'Khách hàng',
    icon: 'Building2',
    route: '/system/customers',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'customers', action: 'read' }],
    },
    actions: [
      {
        id: 'create',
        label: 'Tạo khách hàng',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'customers', action: 'create' }],
        },
      },
      {
        id: 'update',
        label: 'Chỉnh sửa khách hàng',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'customers', action: 'update' }],
        },
      },
      {
        id: 'delete',
        label: 'Xóa khách hàng',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'customers', action: 'delete' }],
        },
      },
      {
        id: 'filter-by-type',
        label: 'Lọc theo loại khách hàng',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'customers', action: 'read' }],
        },
      },
    ],
  },
  {
    id: 'policies',
    label: 'Quản lý policies',
    icon: 'Shield',
    route: '/system/policies',
    requiredPermissions: { strategy: 'all', resources: [{ resource: 'policies', action: 'read' }] },
    actions: [
      {
        id: 'create',
        label: 'Tạo policy',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'policies', action: 'create' }],
        },
      },
      {
        id: 'update',
        label: 'Chỉnh sửa policy',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'policies', action: 'update' }],
        },
      },
      {
        id: 'delete',
        label: 'Xóa policy',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'policies', action: 'delete' }],
        },
      },
      {
        id: 'filter-by-effect',
        label: 'Lọc theo hiệu lực',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'policies', action: 'read' }],
        },
      },
      {
        id: 'filter-by-action',
        label: 'Lọc theo action',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'policies', action: 'read' }],
        },
      },
    ],
  },
  {
    id: 'roles',
    label: 'Quản lý vai trò',
    icon: 'Settings',
    route: '/system/roles',
    requiredPermissions: { strategy: 'all', resources: [{ resource: 'roles', action: 'read' }] },
    actions: [
      {
        id: 'create',
        label: 'Tạo vai trò',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'roles', action: 'create' }],
        },
      },
      {
        id: 'update',
        label: 'Chỉnh sửa vai trò',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'roles', action: 'update' }],
        },
      },
      {
        id: 'delete',
        label: 'Xóa vai trò',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'roles', action: 'delete' }],
        },
      },
      {
        id: 'filter',
        label: 'Lọc vai trò',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'roles', action: 'read' }],
        },
      },
    ],
  },
  {
    id: 'departments',
    label: 'Quản lý bộ phận',
    icon: 'Building2',
    route: '/system/departments',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'departments', action: 'read' }],
    },
    actions: [
      {
        id: 'create',
        label: 'Tạo bộ phận',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'departments', action: 'create' }],
        },
      },
      {
        id: 'update',
        label: 'Chỉnh sửa bộ phận',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'departments', action: 'update' }],
        },
      },
      {
        id: 'delete',
        label: 'Xóa bộ phận',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'departments', action: 'delete' }],
        },
      },
      {
        id: 'filter',
        label: 'Lọc bộ phận',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'departments', action: 'read' }],
        },
      },
    ],
  },
  {
    id: 'system-settings',
    label: 'Cấu hình hệ thống',
    icon: 'Settings',
    route: '/system/system-settings',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'system-settings', action: 'read' }],
    },
  },
]
