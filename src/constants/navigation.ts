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
  labelEn?: string
  labelVi?: string
  icon?: string
  requiredPermissions?: NavRequiredPermissions
  metadata?: Record<string, unknown>
}

// Basic permissions that all authenticated users should have access to
// These are essential endpoints like notifications, navigation, currencies, policy conditions, etc.
export const BASIC_PERMISSIONS: NavRequiredPermissions = {
  strategy: 'all',
  resources: [
    { resource: 'notifications', action: 'read' }, // Get all notifications
    { resource: 'notifications.unread-count', action: 'read' }, // Get unread notification count
    { resource: 'notifications.read', action: 'update' }, // Mark notification as read
    { resource: 'notifications.read-all', action: 'update' }, // Mark all notifications as read
    { resource: 'navigation', action: 'read' }, // Get navigation data
    { resource: 'navigation-config', action: 'read' }, // Get navigation configuration
    { resource: 'currencies', action: 'read' }, // Get currencies list (base currencies)
    { resource: 'policy-conditions', action: 'read' }, // Get policy conditions (for rule builder)
    { resource: 'resource-types', action: 'read' }, // Get resource types (for rule builder)
  ],
}

// Helper function to merge basic permissions with additional permissions
export const withBasicPermissions = (
  additionalResources: NavPermissionResource[]
): NavRequiredPermissions => ({
  strategy: 'all',
  resources: [...BASIC_PERMISSIONS.resources, ...additionalResources],
})

export type NavItemPayload = {
  id: string
  name?: string
  label: string
  labelEn?: string
  labelVi?: string
  icon?: string
  route?: string
  description?: string
  descriptionEn?: string
  descriptionVi?: string
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
    labelEn: 'Overview',
    labelVi: 'Tổng quan',
    icon: 'LayoutDashboard',
    route: '/user/dashboard',
    description: 'Tổng quan',
    descriptionEn: 'Overview',
    descriptionVi: 'Tổng quan',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'dashboard.overview', action: 'read' }],
    },
    actions: [
      {
        id: 'view-devices',
        label: 'Xem thiết bị',
        labelEn: 'View devices',
        labelVi: 'Xem thiết bị',
        icon: 'Printer',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices', action: 'read' }],
        },
      },
      {
        id: 'create-service-request',
        label: 'Gửi yêu cầu',
        labelEn: 'Create service request',
        labelVi: 'Gửi yêu cầu',
        icon: 'Send',
        requiredPermissions: {
          strategy: 'all',
          resources: [
            { resource: 'service-requests', action: 'create' },
            { resource: 'devices', action: 'read' },
            { resource: 'slas', action: 'read' },
          ],
        },
      },
    ],
  },
  {
    id: 'user-devices',
    name: 'devices',
    label: 'Thiết bị',
    labelEn: 'Devices',
    labelVi: 'Thiết bị',
    icon: 'Printer',
    route: '/user/devices',
    description: 'Thiết bị của tôi',
    requiredPermissions: {
      strategy: 'all',
      resources: [
        { resource: 'devices', action: 'read' },
        { resource: 'device-models', action: 'read' },
        { resource: 'customers', action: 'read' },
        { resource: 'devices.consumables', action: 'read' },
        { resource: 'devices.usage-history', action: 'read' },
        { resource: 'reports.usage.pages.monthly', action: 'read' },
        { resource: 'maintenance-histories.devices', action: 'read' },
      ],
    },
    actions: [
      {
        id: 'update',
        label: 'Chỉnh sửa thiết bị',
        labelEn: 'Edit device',
        labelVi: 'Chỉnh sửa thiết bị',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices', action: 'update' }],
        },
      },

      {
        id: 'toggle-active',
        label: 'Bật/Tắt thiết bị',
        labelEn: 'Toggle active',
        labelVi: 'Bật/Tắt thiết bị',
        icon: 'Power',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices', action: 'update' }],
        },
      },
      {
        id: 'view-usage-history',
        label: 'Xem lịch sử sử dụng',
        labelEn: 'View usage history',
        labelVi: 'Xem lịch sử sử dụng',
        icon: 'History',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices.usage-history', action: 'read' }],
        },
      },
      {
        id: 'view-monthly-usage-report',
        label: 'Xem báo cáo trang tháng',
        labelEn: 'View monthly usage report',
        labelVi: 'Xem báo cáo trang tháng',
        icon: 'BarChart3',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports.usage.pages.monthly', action: 'read' }],
        },
      },
      {
        id: 'view-device-consumables',
        label: 'Xem vật tư của thiết bị',
        labelEn: 'View device consumables',
        labelVi: 'Xem vật tư của thiết bị',
        icon: 'Package',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices.consumables', action: 'read' }],
        },
      },
      {
        id: 'view-maintenance-history',
        label: 'Xem lịch sử bảo trì',
        labelEn: 'View maintenance history',
        labelVi: 'Xem lịch sử bảo trì',
        icon: 'Eye',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'maintenance-histories.devices', action: 'read' }],
        },
      },
      {
        id: 'create-maintenance-history',
        label: 'Tạo lịch sử bảo trì',
        labelEn: 'Create maintenance history',
        labelVi: 'Tạo lịch sử bảo trì',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'maintenance-histories.devices', action: 'create' }],
        },
      },
      {
        id: 'update-maintenance-history',
        label: 'Cập nhật lịch sử bảo trì',
        labelEn: 'Update maintenance history',
        labelVi: 'Cập nhật lịch sử bảo trì',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'maintenance-histories.devices', action: 'update' }],
        },
      },
      {
        id: 'delete-maintenance-history',
        label: 'Xóa lịch sử bảo trì',
        labelEn: 'Delete maintenance history',
        labelVi: 'Xóa lịch sử bảo trì',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'maintenance-histories.devices', action: 'delete' }],
        },
      },
      {
        id: 'view-a4-history',
        label: 'Xem lịch sử A4',
        labelEn: 'View A4 history',
        labelVi: 'Xem lịch sử A4',
        icon: 'FileText',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports.usage.a4-equivalent', action: 'read' }],
        },
      },
      {
        id: 'create-a4-snapshot',
        label: 'Tạo snapshot A4',
        labelEn: 'Create A4 snapshot',
        labelVi: 'Tạo snapshot A4',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports.usage.a4-equivalent', action: 'create' }],
        },
      },
      {
        id: 'delete-a4-snapshot',
        label: 'Xóa snapshot A4',
        labelEn: 'Delete A4 snapshot',
        labelVi: 'Xóa snapshot A4',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports.usage.a4-equivalent', action: 'delete' }],
        },
      },
      {
        id: 'create-service-request',
        label: 'Tạo yêu cầu',
        labelEn: 'Create service request',
        labelVi: 'Tạo yêu cầu',
        icon: 'FileText',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'service-requests', action: 'create' }],
        },
      },
    ],
  },
  {
    id: 'user-costs',
    name: 'costs',
    label: 'Chi phí',
    labelEn: 'Costs',
    labelVi: 'Chi phí',
    icon: 'BarChart3',
    route: '/user/dashboard/costs/monthly',
    description: 'Báo cáo chi phí theo tháng',
    descriptionEn: 'Monthly cost report',
    requiredPermissions: {
      strategy: 'any',
      resources: [
        // Monthly costs (customer)
        { resource: 'reports.analytics.cost.customer', action: 'read' },
        // Device cost series (used for trends & aggregation)
        { resource: 'reports.analytics.cost.devices', action: 'read' },
        // Usage tab (customer)
        { resource: 'reports.analytics.usage.customer', action: 'read' },
        // Device usage history dialog inside usage tab
        { resource: 'devices.usage-history', action: 'read' },
      ],
    },
    actions: [
      {
        id: 'view-monthly-tab',
        label: 'Xem chi phí theo tháng',
        labelEn: 'View monthly costs',
        labelVi: 'Xem chi phí theo tháng',
        icon: 'DollarSign',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports.analytics.cost.customer', action: 'read' }],
        },
      },
      {
        id: 'view-usage-tab',
        label: 'Xem usage',
        labelEn: 'View usage',
        labelVi: 'Xem usage',
        icon: 'FileText',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports.analytics.usage.customer', action: 'read' }],
        },
      },
      {
        id: 'load-cost-data',
        label: 'Tải dữ liệu chi phí',
        labelEn: 'Load cost data',
        labelVi: 'Tải dữ liệu chi phí',
        icon: 'RefreshCw',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports.analytics.cost.customer', action: 'read' }],
        },
      },
      {
        id: 'view-device-cost-trend',
        label: 'Xem xu hướng chi phí thiết bị',
        labelEn: 'View device cost trends',
        labelVi: 'Xem xu hướng chi phí thiết bị',
        icon: 'TrendingUp',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports.analytics.cost.devices', action: 'read' }],
        },
      },
      {
        id: 'load-usage-data',
        label: 'Tải dữ liệu usage',
        labelEn: 'Load usage data',
        labelVi: 'Tải dữ liệu usage',
        icon: 'RefreshCw',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports.analytics.usage.customer', action: 'read' }],
        },
      },
      {
        id: 'view-device-usage-history',
        label: 'Xem lịch sử sử dụng thiết bị',
        labelEn: 'View device usage history',
        labelVi: 'Xem lịch sử sử dụng thiết bị',
        icon: 'History',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices.usage-history', action: 'read' }],
        },
      },
    ],
  },
  {
    id: 'user-contracts',
    name: 'contracts',
    label: 'Hợp đồng',
    labelEn: 'Contracts',
    labelVi: 'Hợp đồng',
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
        id: 'delete',
        label: 'Xóa hợp đồng',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'contracts', action: 'delete' }],
        },
      },
      {
        id: 'view-contract-devices',
        label: 'Xem thiết bị của hợp đồng',
        labelEn: 'View contract devices',
        labelVi: 'Xem thiết bị của hợp đồng',
        icon: 'Monitor',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'contracts.devices', action: 'read' }],
        },
      },
    ],
  },
  {
    id: 'user-consumables',
    name: 'consumables',
    label: 'Kho vật tư',
    labelEn: 'Consumables',
    labelVi: 'Kho vật tư',
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
        labelEn: 'Create consumables',
        labelVi: 'Tạo vật tư tiêu hao',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [
            { resource: 'consumables', action: 'create' },
            // BulkAssignModal needs these for dropdowns
            { resource: 'consumable-types', action: 'read' },
            { resource: 'customers', action: 'read' },
          ],
        },
      },
    ],
  },
  {
    id: 'user-warehouse-documents',
    name: 'warehouse-documents',
    label: 'Chứng từ kho',
    labelEn: 'Warehouse documents',
    labelVi: 'Chứng từ kho',
    icon: 'Package',
    route: '/user/warehouse-documents',
    description: 'Quản lý chứng từ kho (user)',
    requiredPermissions: {
      strategy: 'all',
      resources: [{ resource: 'warehouse-documents', action: 'read' }],
    },
    actions: [
      {
        id: 'create',
        label: 'Tạo chứng từ kho',
        labelEn: 'Create warehouse document',
        labelVi: 'Tạo chứng từ kho',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [
            { resource: 'warehouse-documents', action: 'create' },
            // WarehouseDocumentForm dependencies
            { resource: 'customers', action: 'read' },
            { resource: 'consumable-types', action: 'read' },
            { resource: 'currencies', action: 'read' },
          ],
        },
      },
    ],
  },
  {
    id: 'user-my-requests',
    name: 'my-requests',
    label: 'Yêu cầu của tôi',
    labelEn: 'My requests',
    labelVi: 'Yêu cầu của tôi',
    icon: 'FileText',
    route: '/user/my-requests',
    description: 'Theo dõi yêu cầu bảo trì của tôi',
    requiredPermissions: {
      // This page contains multiple tabs (service requests, purchase requests, SLA)
      // so allow access if user can read at least one.
      strategy: 'any',
      resources: [
        { resource: 'service-requests', action: 'read' },
        { resource: 'purchase-requests', action: 'read' },
        { resource: 'slas', action: 'read' },
      ],
    },
    actions: [
      {
        id: 'view-service-requests',
        label: 'Xem yêu cầu dịch vụ',
        labelEn: 'View service requests',
        labelVi: 'Xem yêu cầu dịch vụ',
        icon: 'Eye',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'service-requests', action: 'read' }],
        },
      },
      {
        id: 'view-purchase-requests',
        label: 'Xem yêu cầu mua hàng',
        labelEn: 'View purchase requests',
        labelVi: 'Xem yêu cầu mua hàng',
        icon: 'Eye',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'purchase-requests', action: 'read' }],
        },
      },
      {
        id: 'view-sla',
        label: 'Xem SLA',
        labelEn: 'View SLAs',
        labelVi: 'Xem SLA',
        icon: 'Eye',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'slas', action: 'read' }],
        },
      },
      {
        id: 'filter-by-customer',
        label: 'Lọc theo khách hàng',
        labelEn: 'Filter by customer',
        labelVi: 'Lọc theo khách hàng',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'customers', action: 'read' }],
        },
      },
      {
        id: 'create-service-request',
        label: 'Tạo yêu cầu dịch vụ',
        labelEn: 'Create service request',
        labelVi: 'Tạo yêu cầu dịch vụ',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [
            { resource: 'service-requests', action: 'create' },
            // ServiceRequestFormModal dependencies
            { resource: 'devices', action: 'read' },
            { resource: 'slas', action: 'read' },
            { resource: 'users', action: 'read' },
          ],
        },
      },
      {
        id: 'create-purchase-request',
        label: 'Tạo yêu cầu mua hàng',
        labelEn: 'Create purchase request',
        labelVi: 'Tạo yêu cầu mua hàng',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [
            { resource: 'purchase-requests', action: 'create' },
            // ServiceRequestFormModal dependencies
            { resource: 'devices', action: 'read' },
            { resource: 'device-models.compatible-consumables', action: 'read' },
            { resource: 'users', action: 'read' },
          ],
        },
      },
      {
        id: 'close-service-request',
        label: 'Đóng yêu cầu dịch vụ',
        labelEn: 'Close service request',
        labelVi: 'Đóng yêu cầu dịch vụ',
        icon: 'XCircle',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'service-requests.status', action: 'update' }],
        },
      },
      {
        id: 'bulk-close-service-requests',
        label: 'Đóng nhiều yêu cầu dịch vụ',
        labelEn: 'Bulk close service requests',
        labelVi: 'Đóng nhiều yêu cầu dịch vụ',
        icon: 'XCircle',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'service-requests.status', action: 'update' }],
        },
      },
    ],
  },

  /* Departments (user-scoped) removed — hidden per request */
  {
    id: 'users',
    name: 'users',
    label: 'Người dùng',
    labelEn: 'Users',
    labelVi: 'Người dùng',
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
        id: 'reset-password',
        label: 'Đặt lại mật khẩu',
        labelEn: 'Reset password',
        labelVi: 'Đặt lại mật khẩu',
        icon: 'Key',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'users.password', action: 'update' }],
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
    label: 'Tổng quan hệ thống',
    labelEn: 'System Overview',
    labelVi: 'Tổng quan hệ thống',
    icon: 'LayoutDashboard',
    route: '/system',
    description:
      'Bảng điều khiển tổng quan toàn hệ thống với các chỉ số chính và hoạt động gần đây',
    descriptionEn:
      'System dashboard providing comprehensive overview with key metrics and recent activities',
    descriptionVi:
      'Bảng điều khiển tổng quan toàn hệ thống với các chỉ số chính và hoạt động gần đây',
    requiredPermissions: withBasicPermissions([
      { resource: 'dashboard.admin.overview', action: 'read' },
    ]),
    actions: [
      {
        id: 'aggregate-monthly-revenue',
        label: 'Tổng hợp dữ liệu tháng',
        labelEn: 'Aggregate Monthly Data',
        labelVi: 'Tổng hợp dữ liệu tháng',
        icon: 'Calendar',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports.jobs.monthly-aggregation', action: 'create' }],
        },
      },
      {
        id: 'top-customers-costs',
        label: 'Xem top khách hàng chi phí',
        labelEn: 'View Top Cost Customers',
        labelVi: 'Xem top khách hàng chi phí',
        icon: 'Trophy',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports.costs.top-customers', action: 'read' }],
        },
      },
      {
        id: 'view-dashboard-customer-overview',
        label: 'Xem chi tiết khách hàng',
        labelEn: 'View Customer Details',
        labelVi: 'Xem chi tiết khách hàng',
        icon: 'Eye',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'dashboard.overview', action: 'read' }],
        },
      },
      {
        id: 'view-contracts',
        label: 'Quản lý hợp đồng',
        labelEn: 'Manage Contracts',
        labelVi: 'Quản lý hợp đồng',
        icon: 'FileText',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'contracts', action: 'read' }],
        },
      },
      {
        id: 'view-contract-detail',
        label: 'Xem chi tiết hợp đồng',
        labelEn: 'View Contract Details',
        labelVi: 'Xem chi tiết hợp đồng',
        icon: 'FileText',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'contracts', action: 'read' }],
        },
      },
      {
        id: 'view-service-requests',
        label: 'Quản lý yêu cầu dịch vụ',
        labelEn: 'Manage Service Requests',
        labelVi: 'Quản lý yêu cầu dịch vụ',
        icon: 'FileText',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'service-requests', action: 'read' }],
        },
      },
      {
        id: 'export-monthly-pdf',
        label: 'Xuất báo cáo PDF',
        labelEn: 'Export PDF Report',
        labelVi: 'Xuất báo cáo PDF',
        icon: 'FileText',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports.monthly.export.pdf', action: 'read' }],
        },
      },
      {
        id: 'export-monthly-csv',
        label: 'Xuất báo cáo CSV',
        labelEn: 'Export CSV Report',
        labelVi: 'Xuất báo cáo CSV',
        icon: 'FileSpreadsheet',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports.monthly.export.csv', action: 'read' }],
        },
      },
      {
        id: 'view-customers',
        label: 'Quản lý khách hàng',
        labelEn: 'Manage Customers',
        labelVi: 'Quản lý khách hàng',
        icon: 'Building2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'customers', action: 'read' }],
        },
      },
    ],
  },
  {
    id: 'revenue',
    label: 'Doanh thu',
    labelEn: 'Revenue',
    labelVi: 'Doanh thu',
    icon: 'BarChart3',
    route: '/system/revenue',
    description: 'Báo cáo doanh thu theo thiết bị và theo tháng',
    descriptionEn: 'Revenue reports by device and month',
    descriptionVi: 'Báo cáo doanh thu theo thiết bị và theo tháng',
    requiredPermissions: withBasicPermissions([
      { resource: 'customers', action: 'read' },
      { resource: 'devices', action: 'read' },
      { resource: 'consumables', action: 'read' },
    ]),
    actions: [
      {
        id: 'view-analytics-profit-enterprise',
        label: 'Xem phân tích lợi nhuận doanh nghiệp',
        icon: 'TrendingUp',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports.analytics.profit.enterprise', action: 'read' }],
        },
      },
      {
        id: 'view-analytics-profit-customers',
        label: 'Xem phân tích lợi nhuận khách hàng',
        icon: 'Users',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports.analytics.profit.customers', action: 'read' }],
        },
      },
      {
        id: 'view-analytics-profit-customer',
        label: 'Xem phân tích lợi nhuận khách hàng chi tiết',
        icon: 'User',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports.analytics.profit.customers', action: 'read' }],
        },
      },
      {
        id: 'view-analytics-profit-device',
        label: 'Xem phân tích lợi nhuận thiết bị',
        icon: 'Printer',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports.analytics.profit.devices', action: 'read' }],
        },
      },
      {
        id: 'view-analytics-usage-enterprise',
        label: 'Xem phân tích sử dụng doanh nghiệp',
        icon: 'BarChart',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports.analytics.usage.enterprise', action: 'read' }],
        },
      },
      {
        id: 'view-analytics-usage-customers',
        label: 'Xem phân tích sử dụng khách hàng',
        icon: 'Users',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports.analytics.usage.customers', action: 'read' }],
        },
      },
      {
        id: 'view-analytics-usage-customer',
        label: 'Xem phân tích sử dụng khách hàng chi tiết',
        icon: 'User',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports.analytics.usage.customer', action: 'read' }],
        },
      },
      {
        id: 'view-analytics-usage-device',
        label: 'Xem phân tích sử dụng thiết bị',
        icon: 'Printer',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports.analytics.usage.devices', action: 'read' }],
        },
      },
      {
        id: 'view-analytics-consumables-lifecycle',
        label: 'Xem vòng đời vật tư',
        icon: 'Package',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports.analytics.consumables.lifecycle', action: 'read' }],
        },
      },
    ],
  },
  {
    id: 'usage-page',
    label: 'Usage Page OCR',
    labelEn: 'Usage Page OCR',
    labelVi: 'Trang sử dụng (OCR)',
    icon: 'Upload',
    route: '/system/reports/usage-page',
    description: 'Upload ảnh counter, OCR và duyệt số liệu',
    descriptionEn: 'Upload counter images, OCR and review extracted data',
    descriptionVi: 'Upload ảnh counter, OCR và duyệt số liệu',
    requiredPermissions: withBasicPermissions([
      { resource: 'reports.usage-page.process', action: 'create' },
      { resource: 'reports.usage-page.approve', action: 'update' },
    ]),
    actions: [],
  },
  {
    id: 'cost-adjustments',
    label: 'Điều chỉnh chi phí',
    labelEn: 'Cost adjustments',
    labelVi: 'Điều chỉnh chi phí',
    icon: 'Calculator',
    route: '/system/cost-adjustments',
    description: 'Quản lý phiếu cộng/trừ chi phí theo thiết bị',
    requiredPermissions: withBasicPermissions([
      { resource: 'cost-adjustments', action: 'read' },
      { resource: 'customers', action: 'read' },
      { resource: 'devices', action: 'read' },
    ]),
    actions: [
      {
        id: 'list-cost-adjustments',
        label: 'Xem danh sách điều chỉnh chi phí',
        labelEn: 'View cost adjustments list',
        labelVi: 'Xem danh sách điều chỉnh chi phí',
        icon: 'List',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'cost-adjustments', action: 'read' }],
        },
      },
      {
        id: 'create-cost-adjustment',
        label: 'Tạo điều chỉnh chi phí',
        labelEn: 'Create cost adjustment',
        labelVi: 'Tạo điều chỉnh chi phí',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'cost-adjustments', action: 'create' }],
        },
      },
      {
        id: 'view-cost-adjustment-detail',
        label: 'Xem chi tiết điều chỉnh chi phí',
        labelEn: 'View cost adjustment detail',
        labelVi: 'Xem chi tiết điều chỉnh chi phí',
        icon: 'Eye',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'cost-adjustments', action: 'read' }],
        },
      },
      {
        id: 'update-cost-adjustment',
        label: 'Cập nhật điều chỉnh chi phí',
        labelEn: 'Update cost adjustment',
        labelVi: 'Cập nhật điều chỉnh chi phí',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'cost-adjustments', action: 'update' }],
        },
      },
    ],
  },
  {
    id: 'devices',
    name: 'devices',
    label: 'Thiết bị',
    labelEn: 'Devices',
    labelVi: 'Thiết bị',
    icon: 'Printer',
    route: '/system/devices',
    description: 'Quản lý thiết bị',
    descriptionEn: 'Manage devices',
    descriptionVi: 'Quản lý thiết bị',
    requiredPermissions: withBasicPermissions([
      { resource: 'customers', action: 'read' },
      { resource: 'devices', action: 'read' },
      { resource: 'device-models', action: 'read' },
    ]),
    actions: [
      {
        id: 'read',
        label: 'Xem thiết bị',
        labelEn: 'View device',
        labelVi: 'Xem thiết bị',
        icon: 'Eye',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices', action: 'read' }],
        },
      },
      {
        id: 'view-device-detail',
        label: 'Xem chi tiết thiết bị',
        labelEn: 'View device details',
        labelVi: 'Xem chi tiết thiết bị',
        icon: 'Eye',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices', action: 'read' }],
        },
      },
      {
        id: 'view-device-consumables',
        label: 'Xem vật tư thiết bị',
        labelEn: 'View device consumables',
        labelVi: 'Xem vật tư thiết bị',
        icon: 'Package',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices.consumables', action: 'read' }],
        },
      },
      {
        id: 'view-compatible-consumables',
        label: 'Xem vật tư tương thích',
        labelEn: 'View compatible consumables',
        labelVi: 'Xem vật tư tương thích',
        icon: 'Package',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'device-models.compatible-consumables', action: 'read' }],
        },
      },
      {
        id: 'view-device-usage-reports',
        label: 'Xem báo cáo sử dụng thiết bị',
        labelEn: 'View device usage reports',
        labelVi: 'Xem báo cáo sử dụng thiết bị',
        icon: 'BarChart',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'reports.usage.pages.monthly', action: 'read' }],
        },
      },
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
        id: 'view-customer-list',
        label: 'Xem danh sách khách hàng',
        labelEn: 'View customer list',
        labelVi: 'Xem danh sách khách hàng',
        icon: 'Users',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'customers', action: 'read' }],
        },
      },
      {
        id: 'view-customer-detail',
        label: 'Xem chi tiết khách hàng',
        labelEn: 'View customer detail',
        labelVi: 'Xem chi tiết khách hàng',
        icon: 'User',
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
          resources: [{ resource: 'devices.assign-to-customer', action: 'create' }],
        },
      },
      {
        id: 'set-a4-pricing',
        label: 'Gán giá A4',
        icon: 'BarChart3',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices.pricing', action: 'update' }],
        },
      },
      {
        id: 'toggle-active',
        label: 'Bật/Tắt thiết bị',
        labelEn: 'Toggle device active status',
        labelVi: 'Bật/Tắt thiết bị',
        icon: 'Power',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices', action: 'update' }],
        },
      },
      {
        id: 'view-pricing-active',
        label: 'Xem giá đang áp dụng',
        labelEn: 'View active pricing',
        labelVi: 'Xem giá đang áp dụng',
        icon: 'Eye',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices.pricing.active', action: 'read' }],
        },
      },
      {
        id: 'install-consumable',
        label: 'Cài đặt vật tư',
        labelEn: 'Install consumable',
        labelVi: 'Cài đặt vật tư',
        icon: 'Wrench',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices.install-consumable', action: 'create' }],
        },
      },
      {
        id: 'update-device-consumable',
        label: 'Cập nhật vật tư thiết bị',
        labelEn: 'Update device consumable',
        labelVi: 'Cập nhật vật tư thiết bị',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices.consumables', action: 'update' }],
        },
      },
      {
        id: 'set-consumable-warning',
        label: 'Cài đặt cảnh báo vật tư',
        labelEn: 'Set consumable warning',
        labelVi: 'Cài đặt cảnh báo vật tư',
        icon: 'AlertTriangle',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices.consumables.warning', action: 'update' }],
        },
      },
      {
        id: 'create-consumable',
        label: 'Tạo vật tư',
        labelEn: 'Create consumable',
        labelVi: 'Tạo vật tư',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices.consumables', action: 'create' }],
        },
      },
      {
        id: 'edit-consumable',
        label: 'Chỉnh sửa vật tư',
        labelEn: 'Edit consumable',
        labelVi: 'Chỉnh sửa vật tư',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices.consumables', action: 'update' }],
        },
      },
      {
        id: 'delete-device-consumable',
        label: 'Xóa vật tư thiết bị',
        labelEn: 'Delete device consumable',
        labelVi: 'Xóa vật tư thiết bị',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices.consumables', action: 'delete' }],
        },
      },
      {
        id: 'return-to-warehouse',
        label: 'Trả về kho',
        icon: 'Package',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices.return-to-warehouse', action: 'update' }],
        },
      },
      {
        id: 'view-usage-history',
        label: 'Xem lịch sử sử dụng',
        labelEn: 'View usage history',
        labelVi: 'Xem lịch sử sử dụng',
        icon: 'History',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices.usage-history', action: 'read' }],
        },
      },
      {
        id: 'view-consumable-usage-history',
        label: 'Xem lịch sử sử dụng vật tư',
        labelEn: 'View consumable usage history',
        labelVi: 'Xem lịch sử sử dụng vật tư',
        icon: 'Package',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'consumable-usage-history.devices', action: 'read' }],
        },
      },
      {
        id: 'view-device-stats',
        label: 'Xem thống kê thiết bị',
        labelEn: 'View device statistics',
        labelVi: 'Xem thống kê thiết bị',
        icon: 'BarChart',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'devices.stats', action: 'read' }],
        },
      },
      {
        id: 'create-maintenance-history',
        label: 'Tạo lịch sử bảo trì',
        labelEn: 'Create maintenance history',
        labelVi: 'Tạo lịch sử bảo trì',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'maintenance-histories', action: 'create' }],
        },
      },
      {
        id: 'update-maintenance-history',
        label: 'Cập nhật lịch sử bảo trì',
        labelEn: 'Update maintenance history',
        labelVi: 'Cập nhật lịch sử bảo trì',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'maintenance-histories', action: 'update' }],
        },
      },
      {
        id: 'delete-maintenance-history',
        label: 'Xóa lịch sử bảo trì',
        labelEn: 'Delete maintenance history',
        labelVi: 'Xóa lịch sử bảo trì',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'maintenance-histories', action: 'delete' }],
        },
      },
      {
        id: 'view-maintenance-by-device',
        label: 'Xem lịch sử bảo trì theo thiết bị',
        labelEn: 'View maintenance history by device',
        labelVi: 'Xem lịch sử bảo trì theo thiết bị',
        icon: 'Printer',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'maintenance-histories.devices', action: 'read' }],
        },
      },
      {
        id: 'create-maintenance-by-device',
        label: 'Tạo lịch sử bảo trì cho thiết bị',
        labelEn: 'Create maintenance history for device',
        labelVi: 'Tạo lịch sử bảo trì cho thiết bị',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'maintenance-histories.devices', action: 'create' }],
        },
      },
      {
        id: 'view-maintenance-history-detail',
        label: 'Xem chi tiết lịch sử bảo trì',
        labelEn: 'View maintenance history detail',
        labelVi: 'Xem chi tiết lịch sử bảo trì',
        icon: 'Eye',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'maintenance-histories', action: 'read' }],
        },
      },
      {
        id: 'update-maintenance-history-detail',
        label: 'Cập nhật lịch sử bảo trì',
        labelEn: 'Update maintenance history',
        labelVi: 'Cập nhật lịch sử bảo trì',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'maintenance-histories', action: 'update' }],
        },
      },
      {
        id: 'delete-maintenance-history-detail',
        label: 'Xóa lịch sử bảo trì',
        labelEn: 'Delete maintenance history',
        labelVi: 'Xóa lịch sử bảo trì',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'maintenance-histories', action: 'delete' }],
        },
      },
    ],
  },
  {
    id: 'device-models',
    label: 'Mẫu thiết bị',
    labelEn: 'Device models',
    labelVi: 'Mẫu thiết bị',
    icon: 'Building2',
    route: '/system/device-models',
    requiredPermissions: {
      strategy: 'all',
      resources: [
        { resource: 'device-models', action: 'read' },
        { resource: 'consumable-types', action: 'read' },
      ],
    },
    actions: [
      {
        id: 'create',
        label: 'Tạo mẫu thiết bị',
        labelEn: 'Create device model',
        labelVi: 'Tạo mẫu thiết bị',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'device-models', action: 'create' }],
        },
      },
      {
        id: 'update',
        label: 'Chỉnh sửa mẫu',
        labelEn: 'Edit device model',
        labelVi: 'Chỉnh sửa mẫu',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'device-models', action: 'update' }],
        },
      },
      {
        id: 'delete',
        label: 'Xóa mẫu',
        labelEn: 'Delete device model',
        labelVi: 'Xóa mẫu',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'device-models', action: 'delete' }],
        },
      },
      {
        id: 'filter-by-manufacturer',
        label: 'Lọc theo hãng',
        labelEn: 'Filter by manufacturer',
        labelVi: 'Lọc theo hãng',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'device-models', action: 'read' }],
        },
      },
      {
        id: 'filter-by-type',
        label: 'Lọc theo loại',
        labelEn: 'Filter by type',
        labelVi: 'Lọc theo loại',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'device-models', action: 'read' }],
        },
      },
      {
        id: 'manage-compatible-consumables',
        label: 'Quản lý vật tư tương thích',
        labelEn: 'Manage compatible consumables',
        labelVi: 'Quản lý vật tư tương thích',
        icon: 'ShoppingCart',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'device-models.compatible-consumables', action: 'read' }],
        },
      },
      {
        id: 'add-compatible-consumable',
        label: 'Thêm vật tư tương thích',
        labelEn: 'Add compatible consumable',
        labelVi: 'Thêm vật tư tương thích',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'device-models.compatible-consumables', action: 'create' }],
        },
      },
      {
        id: 'remove-compatible-consumable',
        label: 'Xóa vật tư tương thích',
        labelEn: 'Remove compatible consumable',
        labelVi: 'Xóa vật tư tương thích',
        icon: 'Minus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'device-models.compatible-consumables', action: 'delete' }],
        },
      },
      {
        id: 'view-device-model-detail',
        label: 'Xem chi tiết mẫu thiết bị',
        icon: 'Eye',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'device-models', action: 'read' }],
        },
      },
      {
        id: 'update-device-model-detail',
        label: 'Cập nhật mẫu thiết bị',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'device-models', action: 'update' }],
        },
      },
      {
        id: 'delete-device-model-detail',
        label: 'Xóa mẫu thiết bị',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'device-models', action: 'delete' }],
        },
      },
    ],
  },
  {
    id: 'consumable-types',
    label: 'Loại vật tư tiêu hao',
    labelEn: 'Consumable Types',
    labelVi: 'Loại vật tư tiêu hao',
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
        id: 'view-stock-movements',
        label: 'Xem lịch sử tồn kho',
        icon: 'History',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'stock-items.movements', action: 'read' }],
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
      {
        id: 'import-excel',
        label: 'Nhập từ Excel',
        icon: 'Upload',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'consumable-types.import.excel', action: 'create' }],
        },
      },
      {
        id: 'view-consumable-type-detail',
        label: 'Xem chi tiết loại vật tư',
        icon: 'Eye',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'consumable-types', action: 'read' }],
        },
      },
      {
        id: 'update-consumable-type-detail',
        label: 'Cập nhật loại vật tư',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'consumable-types', action: 'update' }],
        },
      },
      {
        id: 'delete-consumable-type-detail',
        label: 'Xóa loại vật tư',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'consumable-types', action: 'delete' }],
        },
      },
    ],
  },
  {
    id: 'warehouse-documents',
    label: 'Chứng từ kho',
    labelEn: 'Warehouse documents',
    labelVi: 'Chứng từ kho',
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
        labelEn: 'Create document',
        labelVi: 'Tạo chứng từ',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'warehouse-documents', action: 'create' }],
        },
      },
      {
        id: 'update-status',
        label: 'Cập nhật trạng thái',
        labelEn: 'Update status',
        labelVi: 'Cập nhật trạng thái',
        icon: 'CheckCircle',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'warehouse-documents.status', action: 'update' }],
        },
      },
      {
        id: 'cancel',
        label: 'Hủy chứng từ',
        labelEn: 'Cancel document',
        labelVi: 'Hủy chứng từ',
        icon: 'XCircle',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'warehouse-documents.cancel', action: 'update' }],
        },
      },
      {
        id: 'view-detail',
        label: 'Xem chi tiết chứng từ',
        labelEn: 'View document detail',
        labelVi: 'Xem chi tiết chứng từ',
        icon: 'Eye',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'warehouse-documents', action: 'read' }],
        },
      },
    ],
  },
  {
    id: 'customer-requests',
    label: 'Yêu cầu khách hàng',
    labelEn: 'Customer service requests',
    labelVi: 'Yêu cầu khách hàng',
    icon: 'Layers',
    route: '/system/requests',
    description: 'Tổng hợp service request và purchase request',
    descriptionEn: 'Aggregate service requests and purchase requests',
    requiredPermissions: {
      strategy: 'all',
      resources: [
        { resource: 'service-requests', action: 'read' },
        { resource: 'purchase-requests', action: 'read' },
      ],
    },
    actions: [
      {
        id: 'create',
        label: 'Tạo yêu cầu',
        labelEn: 'Create request',
        labelVi: 'Tạo yêu cầu',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'service-requests', action: 'create' }],
        },
      },
      {
        id: 'update-service-status',
        label: 'Cập nhật trạng thái service request',
        labelEn: 'Update service request status',
        labelVi: 'Cập nhật trạng thái service request',
        icon: 'Wrench',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'service-requests.status', action: 'update' }],
        },
      },
      {
        id: 'update-purchase-status',
        label: 'Cập nhật trạng thái purchase request',
        labelEn: 'Update purchase request status',
        labelVi: 'Cập nhật trạng thái purchase request',
        icon: 'ClipboardCheck',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'purchase-requests.status', action: 'update' }],
        },
      },
      {
        id: 'assign-service',
        label: 'Phân công kỹ thuật viên',
        labelEn: 'Assign technician',
        labelVi: 'Phân công kỹ thuật viên',
        icon: 'UserPlus',
        requiredPermissions: {
          strategy: 'all',
          resources: [
            { resource: 'service-requests.assign', action: 'create' },
            { resource: 'users', action: 'read' },
          ],
        },
      },
      {
        id: 'assign-purchase',
        label: 'Phân công purchase request',
        labelEn: 'Assign purchase request',
        labelVi: 'Phân công purchase request',
        icon: 'UserPlus',
        requiredPermissions: {
          strategy: 'all',
          resources: [
            { resource: 'purchase-requests.assign', action: 'create' },
            { resource: 'users', action: 'read' },
          ],
        },
      },
      {
        id: 'view-service-request-detail',
        label: 'Xem chi tiết service request',
        labelEn: 'View service request detail',
        labelVi: 'Xem chi tiết service request',
        icon: 'Eye',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'service-requests', action: 'read' }],
        },
      },
      {
        id: 'view-purchase-request-detail',
        label: 'Xem chi tiết purchase request',
        labelEn: 'View purchase request detail',
        labelVi: 'Xem chi tiết purchase request',
        icon: 'Eye',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'purchase-requests', action: 'read' }],
        },
      },
      {
        id: 'filter-by-customer',
        label: 'Lọc theo khách hàng',
        labelEn: 'Filter by customer',
        labelVi: 'Lọc theo khách hàng',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'customers', action: 'read' }],
        },
      },
      {
        id: 'filter-by-assigned-user',
        label: 'Lọc theo người được phân công',
        labelEn: 'Filter by assigned user',
        labelVi: 'Lọc theo người được phân công',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'users', action: 'read' }],
        },
      },
      {
        id: 'service-messages',
        label: 'Tin nhắn service request',
        labelEn: 'Service request messages',
        labelVi: 'Tin nhắn service request',
        icon: 'MessageSquare',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'service-requests.messages', action: 'read' }],
        },
      },
      {
        id: 'purchase-messages',
        label: 'Tin nhắn purchase request',
        labelEn: 'Purchase request messages',
        labelVi: 'Tin nhắn purchase request',
        icon: 'MessageSquare',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'purchase-requests.messages', action: 'read' }],
        },
      },
      {
        id: 'service-costs',
        label: 'Xem chi phí service request',
        labelEn: 'View service request costs',
        labelVi: 'Xem chi phí service request',
        icon: 'DollarSign',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'service-requests.costs', action: 'read' }],
        },
      },
      {
        id: 'create-service-cost',
        label: 'Tạo chi phí service request',
        labelEn: 'Create service request cost',
        labelVi: 'Tạo chi phí service request',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'service-requests.costs', action: 'create' }],
        },
      },
      {
        id: 'send-service-message',
        label: 'Gửi tin nhắn service request',
        labelEn: 'Send service request message',
        labelVi: 'Gửi tin nhắn service request',
        icon: 'MessageSquare',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'service-requests.messages', action: 'create' }],
        },
      },
      {
        id: 'send-purchase-message',
        label: 'Gửi tin nhắn purchase request',
        labelEn: 'Send purchase request message',
        labelVi: 'Gửi tin nhắn purchase request',
        icon: 'MessageSquare',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'purchase-requests.messages', action: 'create' }],
        },
      },
      {
        id: 'manage-purchase-items',
        label: 'Quản lý items purchase request',
        labelEn: 'Manage purchase request items',
        labelVi: 'Quản lý items purchase request',
        icon: 'Package',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'purchase-requests.items', action: 'create' }],
        },
      },
      {
        id: 'update-purchase-items',
        label: 'Cập nhật items purchase request',
        labelEn: 'Update purchase request items',
        labelVi: 'Cập nhật items purchase request',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'purchase-requests.items', action: 'update' }],
        },
      },
      {
        id: 'delete-purchase-items',
        label: 'Xóa items purchase request',
        labelEn: 'Delete purchase request items',
        labelVi: 'Xóa items purchase request',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'purchase-requests.items', action: 'delete' }],
        },
      },
      {
        id: 'view-service-requests',
        label: 'Xem danh sách service requests',
        labelEn: 'View service requests',
        labelVi: 'Xem danh sách service requests',
        icon: 'List',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'service-requests', action: 'read' }],
        },
      },
      {
        id: 'view-purchase-requests',
        label: 'Xem danh sách purchase requests',
        labelEn: 'View purchase requests',
        labelVi: 'Xem danh sách purchase requests',
        icon: 'List',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'purchase-requests', action: 'read' }],
        },
      },
    ],
  },
  {
    id: 'slas',
    label: 'Quản trị SLA',
    labelEn: 'SLA management',
    labelVi: 'Quản trị SLA',
    icon: 'Shield',
    route: '/system/slas',
    description: 'Định nghĩa SLA & chuẩn hóa cam kết phản hồi',
    descriptionEn: 'Define SLAs and standardize response commitments',
    requiredPermissions: withBasicPermissions([{ resource: 'slas', action: 'read' }]),
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
      {
        id: 'read-customer-for-sla',
        label: 'Đọc thông tin customer để tạo SLA',
        labelEn: 'Read customer info for SLA creation',
        labelVi: 'Đọc thông tin customer để tạo SLA',
        icon: 'UserCheck',
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
    labelEn: 'SLA templates',
    labelVi: 'Mẫu SLA',
    icon: 'Zap',
    route: '/system/sla-templates',
    description: 'Quản lý mẫu SLA để áp dụng cho khách hàng',
    descriptionEn: 'Manage SLA templates to apply to customers',
    requiredPermissions: withBasicPermissions([{ resource: 'sla-templates', action: 'read' }]),
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
      {
        id: 'apply',
        label: 'Áp dụng mẫu SLA',
        icon: 'CheckCircle',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'sla-templates.apply', action: 'create' }],
        },
      },
    ],
  },
  {
    id: 'users',
    label: 'Quản lý người dùng',
    labelEn: 'User management',
    labelVi: 'Quản lý người dùng',
    icon: 'Users',
    route: '/system/users',
    description: 'Quản lý người dùng (system-scoped)',
    descriptionEn: 'Manage users (system-scoped)',
    requiredPermissions: withBasicPermissions([{ resource: 'users', action: 'read' }]),
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
        labelEn: 'Filter by role',
        labelVi: 'Lọc theo vai trò',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'roles', action: 'read' }],
        },
      },
      {
        id: 'filter-by-customer',
        label: 'Lọc theo khách hàng',
        labelEn: 'Filter by customer',
        labelVi: 'Lọc theo khách hàng',
        icon: 'Filter',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'customers', action: 'read' }],
        },
      },
      {
        id: 'reset-password',
        label: 'Đặt lại mật khẩu',
        labelEn: 'Reset password',
        labelVi: 'Đặt lại mật khẩu',
        icon: 'Key',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'users.password', action: 'update' }],
        },
      },
      {
        id: 'read-customer-for-user',
        label: 'Đọc thông tin customer để tạo user',
        labelEn: 'Read customer info for user creation',
        labelVi: 'Đọc thông tin customer để tạo user',
        icon: 'UserCheck',
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
    labelEn: 'Customers',
    labelVi: 'Khách hàng',
    icon: 'Building2',
    route: '/system/customers',
    requiredPermissions: withBasicPermissions([
      { resource: 'customers', action: 'read' },
      { resource: 'customers.overview', action: 'read' },
      { resource: 'device-models', action: 'read' },
    ]),
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
        id: 'view-consumables',
        label: 'Xem vật tư khách hàng',
        icon: 'Package',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'consumables', action: 'read' }],
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
        icon: 'Link',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'contracts.devices', action: 'create' }],
        },
      },
      {
        id: 'contract-detach-devices',
        label: 'Gỡ thiết bị khỏi hợp đồng',
        icon: 'Unlink',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'contracts.devices', action: 'delete' }],
        },
      },
      {
        id: 'contract-attach-devices',
        label: 'Gán thiết bị vào hợp đồng',
        icon: 'MonitorSmartphone',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'contracts.devices', action: 'create' }],
        },
      },
      {
        id: 'contract-detach-devices',
        label: 'Gỡ thiết bị khỏi hợp đồng',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'contracts.devices', action: 'delete' }],
        },
      },
      {
        id: 'view-contract-devices',
        label: 'Xem thiết bị trong hợp đồng',
        icon: 'Eye',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'contracts.devices', action: 'read' }],
        },
      },
      {
        id: 'view-customer-contracts',
        label: 'Xem hợp đồng của khách hàng',
        icon: 'FileText',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'customers.contracts', action: 'read' }],
        },
      },
      {
        id: 'view-customer-consumables',
        label: 'Xem vật tư khách hàng',
        icon: 'Package',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'customers.consumables', action: 'read' }],
        },
      },
      {
        id: 'update-customer-detail',
        label: 'Cập nhật khách hàng',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'customers', action: 'update' }],
        },
      },
      {
        id: 'delete-customer-detail',
        label: 'Xóa khách hàng',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'customers', action: 'delete' }],
        },
      },
    ],
  },
  {
    id: 'policies',
    label: 'Quản lý policies',
    labelEn: 'Policies',
    labelVi: 'Quản lý policies',
    icon: 'Shield',
    route: '/system/policies',
    requiredPermissions: withBasicPermissions([
      { resource: 'policies', action: 'read' },
      { resource: 'roles', action: 'read' },
    ]),
    actions: [
      {
        id: 'create',
        label: 'Tạo policy',
        labelEn: 'Create policy',
        labelVi: 'Tạo policy',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'policies', action: 'create' }],
        },
      },
      {
        id: 'update',
        label: 'Chỉnh sửa policy',
        labelEn: 'Edit policy',
        labelVi: 'Chỉnh sửa policy',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'policies', action: 'update' }],
        },
      },
      {
        id: 'delete',
        label: 'Xóa policy',
        labelEn: 'Delete policy',
        labelVi: 'Xóa policy',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'policies', action: 'delete' }],
        },
      },
      {
        id: 'use-policy-assistant-blueprint',
        label: 'Sử dụng blueprint assistant',
        icon: 'Bot',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'policies.assistant.blueprint', action: 'read' }],
        },
      },
      {
        id: 'use-policy-assistant-chat',
        label: 'Phân tích policy',
        icon: 'Search',
        requiredPermissions: {
          strategy: 'all',
          resources: [
            { resource: 'policies.assistant.chat', action: 'read' },
            { resource: 'policies.assistant.chat', action: 'create' },
          ],
        },
      },
      {
        id: 'read-role',
        label: 'Đọc thông tin roles',
        labelEn: 'Read roles',
        labelVi: 'Đọc thông tin roles',
        icon: 'Users',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'roles', action: 'read' }],
        },
      },
      {
        id: 'read-department',
        label: 'Đọc thông tin departments',
        labelEn: 'Read departments',
        labelVi: 'Đọc thông tin departments',
        icon: 'Building2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'departments', action: 'read' }],
        },
      },
      {
        id: 'read-user',
        label: 'Đọc thông tin users',
        labelEn: 'Read users',
        labelVi: 'Đọc thông tin users',
        icon: 'User',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'users', action: 'read' }],
        },
      },
      {
        id: 'read-customer',
        label: 'Đọc thông tin customers',
        labelEn: 'Read customers',
        labelVi: 'Đọc thông tin customers',
        icon: 'UserCheck',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'customers', action: 'read' }],
        },
      },
    ],
  },
  {
    id: 'roles',
    label: 'Quản lý vai trò',
    labelEn: 'Role management',
    labelVi: 'Quản lý vai trò',
    icon: 'Settings',
    route: '/system/roles',
    requiredPermissions: withBasicPermissions([{ resource: 'roles', action: 'read' }]),
    actions: [
      {
        id: 'create',
        label: 'Tạo vai trò',
        labelEn: 'Create role',
        labelVi: 'Tạo vai trò',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'roles', action: 'create' }],
        },
      },
      {
        id: 'update',
        label: 'Chỉnh sửa vai trò',
        labelEn: 'Edit role',
        labelVi: 'Chỉnh sửa vai trò',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'roles', action: 'update' }],
        },
      },
      {
        id: 'delete',
        label: 'Xóa vai trò',
        labelEn: 'Delete role',
        labelVi: 'Xóa vai trò',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'roles', action: 'delete' }],
        },
      },
    ],
  },
  {
    id: 'system-settings',
    label: 'Cấu hình hệ thống',
    labelEn: 'System settings',
    labelVi: 'Cấu hình hệ thống',
    icon: 'Settings',
    route: '/system/system-settings',
    requiredPermissions: withBasicPermissions([{ resource: 'system-settings', action: 'read' }]),
    actions: [
      {
        id: 'update',
        label: 'Chỉnh sửa cấu hình',
        labelEn: 'Update system setting',
        labelVi: 'Chỉnh sửa cấu hình',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'system-settings', action: 'update' }],
        },
      },
    ],
  },
  {
    id: 'navigation-configs',
    label: 'Cấu hình Navigation',
    labelEn: 'Navigation Configs',
    labelVi: 'Cấu hình Navigation',
    icon: 'Menu',
    route: '/system/navigation-configs',
    description: 'Quản lý cấu hình navigation theo khách hàng',
    descriptionEn: 'Manage navigation configurations by customer',
    descriptionVi: 'Quản lý cấu hình navigation theo khách hàng',
    requiredPermissions: withBasicPermissions([{ resource: 'navigation-config', action: 'read' }]),
    actions: [
      {
        id: 'create',
        label: 'Tạo cấu hình navigation',
        labelEn: 'Create navigation config',
        labelVi: 'Tạo cấu hình navigation',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'navigation-config', action: 'create' }],
        },
      },
      {
        id: 'update',
        label: 'Chỉnh sửa cấu hình navigation',
        labelEn: 'Update navigation config',
        labelVi: 'Chỉnh sửa cấu hình navigation',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'navigation-config', action: 'update' }],
        },
      },
      {
        id: 'delete',
        label: 'Xóa cấu hình navigation',
        labelEn: 'Delete navigation config',
        labelVi: 'Xóa cấu hình navigation',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'navigation-config', action: 'delete' }],
        },
      },
      {
        id: 'view-all-roles',
        label: 'Xem tất cả vai trò',
        labelEn: 'View all roles',
        labelVi: 'Xem tất cả vai trò',
        icon: 'Users',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'role', action: 'read' }],
        },
      },
      {
        id: 'view-all-customers',
        label: 'Xem tất cả khách hàng',
        labelEn: 'View all customers',
        labelVi: 'Xem tất cả khách hàng',
        icon: 'Building2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'customer', action: 'read' }],
        },
      },
    ],
  },
  {
    id: 'exchange-rates',
    label: 'Tỷ giá',
    labelEn: 'Exchange rates',
    labelVi: 'Tỷ giá',
    icon: 'DollarSign',
    route: '/system/exchange-rates',
    description: 'Quản lý tỷ giá hối đoái',
    descriptionEn: 'Manage exchange rates',
    descriptionVi: 'Quản lý tỷ giá hối đoái',
    requiredPermissions: withBasicPermissions([{ resource: 'exchange-rates', action: 'read' }]),
    actions: [
      {
        id: 'create',
        label: 'Tạo tỷ giá',
        labelEn: 'Create exchange rate',
        labelVi: 'Tạo tỷ giá',
        icon: 'Plus',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'exchange-rates', action: 'create' }],
        },
      },
      {
        id: 'update',
        label: 'Cập nhật tỷ giá',
        labelEn: 'Update exchange rate',
        labelVi: 'Cập nhật tỷ giá',
        icon: 'Edit',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'exchange-rates', action: 'update' }],
        },
      },
      {
        id: 'delete',
        label: 'Xóa tỷ giá',
        labelEn: 'Delete exchange rate',
        labelVi: 'Xóa tỷ giá',
        icon: 'Trash2',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'exchange-rates', action: 'delete' }],
        },
      },
      {
        id: 'convert-currency',
        label: 'Chuyển đổi tiền tệ',
        labelEn: 'Convert currency',
        labelVi: 'Chuyển đổi tiền tệ',
        icon: 'ArrowLeftRight',
        requiredPermissions: {
          strategy: 'all',
          resources: [{ resource: 'exchange-rates.convert', action: 'read' }],
        },
      },
    ],
  },
]
