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
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'dashboard', action: 'read' }],
    },
    actions: [],
  },
  {
    id: 'user-devices',
    name: 'devices',
    label: 'Thiết bị',
    icon: 'Printer',
    route: '/user/devices',
    description: 'Thiết bị của tôi',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'devices', action: 'read' }],
    },
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
      {
        id: 'assign-customer',
        label: 'Gán/Gỡ khách hàng',
        icon: 'UserPlus',
        requiredPermissions: {
          strategy: 'all',
          resources: [
            { resource: 'devices', action: 'update' },
            { resource: 'reports', action: 'create' },
          ],
        },
      },
      {
        id: 'assign-pricing',
        label: 'Gán giá cho thiết bị',
        icon: 'Tag',
        requiredPermissions: {
          strategy: 'all',
          resources: [
            { resource: 'devices', action: 'update' },
            { resource: 'reports', action: 'create' },
          ],
        },
      },
      {
        id: 'assign-pricing',
        label: 'Gán giá cho thiết bị',
        icon: 'Tag',
        requiredPermissions: {
          strategy: 'all',
          resources: [
            { resource: 'devices', action: 'update' },
            { resource: 'reports', action: 'create' },
          ],
        },
      },
      {
        id: 'set-consumable-warning',
        label: 'Cập nhật ngưỡng cảnh báo',
        icon: 'Bell',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'consumables', action: 'update' }],
        },
      },
      {
        id: 'set-a4-pricing',
        label: 'Gán giá A4',
        icon: 'BarChart3',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports', action: 'create' }],
        },
      },
    ],
  },
  {
    id: 'user-costs',
    name: 'costs',
    label: 'Chi phí',
    icon: 'BarChart3',
    route: '/user/dashboard/costs/monthly',
    description: 'Báo cáo chi phí theo tháng',
    requiredPermissions: {
      strategy: 'all',
      resources: [
        { resource: 'dashboard', action: 'read' },
        { resource: 'devices', action: 'read' },
      ],
    },
    actions: [],
  },
  {
    id: 'user-contracts',
    name: 'contracts',
    label: 'Hợp đồng',
    icon: 'FileText',
    route: '/user/contracts',
    description: 'Hợp đồng của tôi',
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
    id: 'user-consumables',
    name: 'consumables',
    label: 'Kho vật tư',
    icon: 'ShoppingCart',
    route: '/user/consumables',
    description: 'Vật tư tiêu hao liên quan đến khách hàng',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'consumables', action: 'read' }],
    },
    actions: [
      {
        id: 'create',
        label: 'Tạo vật tư tiêu hao',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'consumables', action: 'create' }],
        },
      },
      {
        id: 'update',
        label: 'Chỉnh sửa vật tư',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'consumables', action: 'update' }],
        },
      },
      {
        id: 'delete',
        label: 'Xóa vật tư',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'consumables', action: 'delete' }],
        },
      },
      {
        id: 'filter-by-type',
        label: 'Lọc theo loại vật tư',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'consumable-types', action: 'read' }],
        },
      },
    ],
  },
  {
    id: 'user-warehouse-documents',
    name: 'warehouse-documents',
    label: 'Chứng từ kho',
    icon: 'Package',
    route: '/user/warehouse-documents',
    description: 'Quản lý chứng từ kho (user)',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'warehouse-documents', action: 'read' }],
    },
  },
  {
    id: 'user-my-requests',
    name: 'my-requests',
    label: 'Yêu cầu của tôi',
    icon: 'FileText',
    route: '/user/my-requests',
    description: 'Theo dõi yêu cầu bảo trì của tôi',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'service-requests', action: 'read' }],
    },
    actions: [
      {
        id: 'create',
        label: 'Tạo yêu cầu',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'service-requests', action: 'create' }],
        },
      },
      {
        id: 'update',
        label: 'Cập nhật yêu cầu',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'service-requests', action: 'update' }],
        },
      },
      {
        id: 'delete',
        label: 'Xóa yêu cầu',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'service-requests', action: 'delete' }],
        },
      },
    ],
  },

  /* Departments (user-scoped) removed — hidden per request */
  {
    id: 'users',
    name: 'users',
    label: 'Người dùng',
    icon: 'Users',
    route: '/user/users',
    description: 'Quản lý người dùng (user-scoped)',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'users', action: 'read' }],
    },
    actions: [
      {
        id: 'read',
        label: 'Xem người dùng',
        icon: 'Eye',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'users', action: 'read' }],
        },
      },
      {
        id: 'create',
        label: 'Tạo người dùng',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [
            { resource: 'users', action: 'create' },
            { resource: 'customers', action: 'read' },
            { resource: 'roles', action: 'read' },
          ],
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
      /* filter-by-department removed */
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
    id: 'cost-adjustments',
    label: 'Điều chỉnh chi phí',
    icon: 'Calculator',
    route: '/system/cost-adjustments',
    description: 'Quản lý phiếu cộng/trừ chi phí theo thiết bị',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'cost-adjustments', action: 'read' }],
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
      {
        id: 'assign-customer',
        label: 'Gán/Gỡ khách hàng',
        icon: 'UserPlus',
        requiredPermissions: {
          strategy: 'all',
          resources: [
            { resource: 'devices', action: 'update' },
            { resource: 'reports', action: 'create' },
          ],
        },
      },
      {
        id: 'set-a4-pricing',
        label: 'Gán giá A4',
        icon: 'BarChart3',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports', action: 'create' }],
        },
      },
      {
        id: 'edit-consumable',
        label: 'Chỉnh sửa vật tư',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'consumables', action: 'update' }],
        },
      },
      {
        id: 'create-consumable',
        label: 'Thêm vật tư tương thích',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'consumables', action: 'create' }],
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
        id: 'edit-stock',
        label: 'Chỉnh sửa tồn kho',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'stock-items', action: 'update' }],
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
    id: 'warehouse-documents',
    label: 'Chứng từ kho',
    icon: 'Package',
    route: '/system/warehouse-documents',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'warehouse-documents', action: 'read' }],
    },
    actions: [
      {
        id: 'create',
        label: 'Tạo chứng từ',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'warehouse-documents', action: 'create' }],
        },
      },
    ],
  },

  {
    id: 'customer-requests',
    label: 'Yêu cầu khách hàng',
    icon: 'Layers',
    route: '/system/requests',
    description: 'Tổng hợp service request và purchase request',
    requiredPermissions: {
      strategy: 'all',
      resources: [
        { resource: 'service-requests', action: 'read' },
        { resource: 'purchase-requests', action: 'read' },
      ],
    },
    actions: [
      {
        id: 'update-service-status',
        label: 'Cập nhật service request',
        icon: 'Wrench',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'service-requests', action: 'update' }],
        },
      },
      {
        id: 'create',
        label: 'Tạo yêu cầu',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'service-requests', action: 'create' }],
        },
      },
      {
        id: 'update-purchase-status',
        label: 'Cập nhật purchase request',
        icon: 'ClipboardCheck',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'purchase-requests', action: 'update' }],
        },
      },
      {
        id: 'assign-service',
        label: 'Phân công kỹ thuật viên',
        icon: 'UserPlus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'service-requests', action: 'update' }],
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
    id: 'slas',
    label: 'Quản trị SLA',
    icon: 'Shield',
    route: '/system/slas',
    description: 'Định nghĩa SLA & chuẩn hóa cam kết phản hồi',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'slas', action: 'read' }],
    },
    actions: [
      {
        id: 'create',
        label: 'Tạo SLA',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'slas', action: 'create' }],
        },
      },
      {
        id: 'update',
        label: 'Cập nhật SLA',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'slas', action: 'update' }],
        },
      },
      {
        id: 'delete',
        label: 'Xóa SLA',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'slas', action: 'delete' }],
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
    id: 'sla-templates',
    label: 'Mẫu SLA',
    icon: 'Zap',
    route: '/system/sla-templates',
    description: 'Quản lý mẫu SLA để áp dụng cho khách hàng',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'sla-templates', action: 'read' }],
    },
    actions: [
      {
        id: 'create',
        label: 'Tạo Mẫu SLA',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'sla-templates', action: 'create' }],
        },
      },
      {
        id: 'update',
        label: 'Cập nhật Mẫu SLA',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'sla-templates', action: 'update' }],
        },
      },
      {
        id: 'delete',
        label: 'Xóa Mẫu SLA',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'sla-templates', action: 'delete' }],
        },
      },
      // 'apply' action removed because backend doesn't support this action.
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
      /* filter-by-department removed */
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
      {
        id: 'contract-create',
        label: 'Tạo hợp đồng',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'contracts', action: 'create' }],
        },
      },
      {
        id: 'contract-update',
        label: 'Chỉnh sửa hợp đồng',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'contracts', action: 'update' }],
        },
      },
      {
        id: 'contract-delete',
        label: 'Xóa hợp đồng',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'contracts', action: 'delete' }],
        },
      },
      {
        id: 'contract-attach-devices',
        label: 'Gán thiết bị vào hợp đồng',
        icon: 'MonitorSmartphone',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'contracts', action: 'update' }],
        },
      },
      {
        id: 'contract-detach-devices',
        label: 'Gỡ thiết bị khỏi hợp đồng',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'contracts', action: 'update' }],
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
  /* Departments (system) removed — hidden per request */
  {
    id: 'system-settings',
    label: 'Cấu hình hệ thống',
    icon: 'Settings',
    route: '/system/system-settings',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'system-settings', action: 'read' }],
    },
    actions: [
      {
        id: 'create',
        label: 'Tạo cấu hình hệ thống',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'system-settings', action: 'create' }],
        },
      },
      {
        id: 'update',
        label: 'Chỉnh sửa cấu hình',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'system-settings', action: 'update' }],
        },
      },
      {
        id: 'delete',
        label: 'Xóa cấu hình',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'system-settings', action: 'delete' }],
        },
      },
    ],
  },
]
