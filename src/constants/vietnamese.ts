/**
 * Vietnamese translations for the application
 */

export const VN = {
  // Common
  common: {
    back: 'Quay lại',
    save: 'Lưu',
    cancel: 'Hủy',
    delete: 'Xóa',
    edit: 'Sửa',
    create: 'Tạo mới',
    view: 'Xem',
    search: 'Tìm kiếm',
    filter: 'Lọc',
    export: 'Xuất',
    loading: 'Đang tải...',
    noResults: 'Không có kết quả',
    actions: 'Thao tác',
    details: 'Chi tiết',
    status: 'Trạng thái',
    priority: 'Ưu tiên',
    createdAt: 'Ngày tạo',
    updatedAt: 'Cập nhật',
  },

  // Auth
  auth: {
    login: 'Đăng nhập',
    logout: 'Đăng xuất',
    username: 'Tên đăng nhập',
    password: 'Mật khẩu',
    loginButton: 'Đăng nhập',
    loggingIn: 'Đang đăng nhập...',
    welcomeTitle: 'Chào mừng đến MPS',
    welcomeDesc: 'Nhập thông tin đăng nhập để truy cập hệ thống',
  },

  // Dashboard
  dashboard: {
    title: 'Tổng quan',
    welcome: 'Chào mừng trở lại',
    overview: 'Tổng quan hệ thống quản lý dịch vụ in ấn của bạn',
  },

  // Devices
  devices: {
    title: 'Thiết bị',
    list: 'Danh sách thiết bị',
    add: 'Thêm thiết bị',
    edit: 'Sửa thiết bị',
    delete: 'Xóa thiết bị',
    serialNumber: 'Số serial',
    model: 'Model',
    location: 'Vị trí',
    status: 'Trạng thái',
    totalPages: 'Tổng trang in',
    lastMaintenance: 'Bảo trì lần cuối',
    nextMaintenance: 'Bảo trì tiếp theo',
  },

  // Service Requests
  serviceRequests: {
    title: 'Yêu cầu bảo trì',
    list: 'Danh sách yêu cầu',
    add: 'Tạo yêu cầu',
    description: 'Mô tả',
    device: 'Thiết bị',
    priority: 'Độ ưu tiên',
    assignedTo: 'Phân công cho',
  },

  // Purchase Requests
  purchaseRequests: {
    title: 'Yêu cầu mua hàng',
    list: 'Danh sách yêu cầu mua',
    add: 'Tạo yêu cầu mua',
    itemName: 'Tên vật tư',
    quantity: 'Số lượng',
    estimatedCost: 'Chi phí ước tính',
    approve: 'Phê duyệt',
    reject: 'Từ chối',
  },

  // Users
  users: {
    title: 'Người dùng',
    list: 'Danh sách người dùng',
    add: 'Thêm người dùng',
    fullName: 'Họ tên',
    email: 'Email',
    role: 'Vai trò',
    active: 'Hoạt động',
    inactive: 'Ngưng hoạt động',
    lastLogin: 'Đăng nhập lần cuối',
  },

  // Reports
  reports: {
    title: 'Báo cáo',
    generate: 'Tạo báo cáo',
    download: 'Tải xuống',
    history: 'Lịch sử báo cáo',
    type: 'Loại báo cáo',
    generating: 'Đang tạo...',
  },

  // Customers
  customers: {
    title: 'Khách hàng',
    list: 'Danh sách khách hàng',
    add: 'Thêm khách hàng',
    name: 'Tên khách hàng',
    address: 'Địa chỉ',
    deviceCount: 'Số thiết bị',
  },

  // Status
  status: {
    active: 'Hoạt động',
    inactive: 'Ngưng hoạt động',
    error: 'Lỗi',
    maintenance: 'Bảo trì',
    new: 'Mới',
    inProgress: 'Đang xử lý',
    resolved: 'Đã xử lý',
    closed: 'Đã đóng',
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    completed: 'Hoàn thành',
    expired: 'Hết hạn',
    terminated: 'Đã chấm dứt',
  },

  // Priority
  priority: {
    low: 'Thấp',
    normal: 'Bình thường',
    high: 'Cao',
    urgent: 'Khẩn cấp',
  },

  // Messages
  messages: {
    deleteConfirm: 'Bạn có chắc muốn xóa?',
    deleteSuccess: 'Xóa thành công',
    createSuccess: 'Tạo mới thành công',
    updateSuccess: 'Cập nhật thành công',
    deleteError: 'Xóa thất bại',
    createError: 'Tạo mới thất bại',
    updateError: 'Cập nhật thất bại',
  },
} as const

export type TranslationKey = keyof typeof VN
