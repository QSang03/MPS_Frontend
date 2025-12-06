// Mock data for device detail tabs

export interface UsageHistoryItem {
  id: string
  date: string
  pagesPrinted: number
  userId: string
  userName: string
  documentType: string
}

export interface ServiceHistoryItem {
  id: string
  date: string
  type: 'maintenance' | 'repair' | 'inspection'
  description: string
  technician: string
  status: 'completed' | 'in_progress' | 'scheduled'
  cost?: number
}

export interface ConsumableItem {
  id: string
  type: 'toner' | 'drum' | 'paper' | 'waste_toner'
  name: string
  model: string
  currentLevel: number // percentage
  maxCapacity: number
  activationDate?: string
  lastReplaced?: string
  nextReplacement?: string
  status: 'good' | 'low' | 'empty' | 'error'
}

export const mockUsageHistory: UsageHistoryItem[] = [
  {
    id: 'usage-1',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    pagesPrinted: 125,
    userId: 'user-1',
    userName: 'Nguyễn Văn A',
    documentType: 'Báo cáo tài chính',
  },
  {
    id: 'usage-2',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    pagesPrinted: 89,
    userId: 'user-2',
    userName: 'Trần Thị B',
    documentType: 'Hợp đồng',
  },
  {
    id: 'usage-3',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    pagesPrinted: 234,
    userId: 'user-3',
    userName: 'Lê Văn C',
    documentType: 'Tài liệu kỹ thuật',
  },
  {
    id: 'usage-4',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    pagesPrinted: 67,
    userId: 'user-1',
    userName: 'Nguyễn Văn A',
    documentType: 'Email',
  },
  {
    id: 'usage-5',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    pagesPrinted: 156,
    userId: 'user-4',
    userName: 'Phạm Thị D',
    documentType: 'Báo cáo tháng',
  },
]

export const mockServiceHistory: ServiceHistoryItem[] = [
  {
    id: 'service-1',
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'maintenance',
    description: 'Bảo trì định kỳ - Thay toner, làm sạch máy',
    technician: 'Kỹ thuật viên Nguyễn Văn E',
    status: 'completed',
    cost: 250000,
  },
  {
    id: 'service-2',
    date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'repair',
    description: 'Sửa chữa lỗi kẹt giấy, thay bộ phận feed',
    technician: 'Kỹ thuật viên Trần Văn F',
    status: 'completed',
    cost: 450000,
  },
  {
    id: 'service-3',
    date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'inspection',
    description: 'Kiểm tra định kỳ, đo chất lượng in',
    technician: 'Kỹ thuật viên Lê Văn G',
    status: 'completed',
    cost: 150000,
  },
  {
    id: 'service-4',
    date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'maintenance',
    description: 'Bảo trì định kỳ tiếp theo',
    technician: 'Kỹ thuật viên Nguyễn Văn E',
    status: 'scheduled',
  },
]

export const mockConsumables: ConsumableItem[] = [
  {
    id: 'consumable-1',
    type: 'toner',
    name: 'Toner Đen',
    model: 'HP 305A',
    currentLevel: 65,
    maxCapacity: 100,
    activationDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    lastReplaced: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    nextReplacement: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'good',
  },
  {
    id: 'consumable-2',
    type: 'toner',
    name: 'Toner Màu (Cyan)',
    model: 'HP 305A',
    currentLevel: 25,
    maxCapacity: 100,
    activationDate: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
    lastReplaced: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    nextReplacement: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'low',
  },
  {
    id: 'consumable-3',
    type: 'toner',
    name: 'Toner Màu (Magenta)',
    model: 'HP 305A',
    currentLevel: 80,
    maxCapacity: 100,
    activationDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    lastReplaced: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    nextReplacement: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'good',
  },
  {
    id: 'consumable-4',
    type: 'toner',
    name: 'Toner Màu (Yellow)',
    model: 'HP 305A',
    currentLevel: 90,
    maxCapacity: 100,
    activationDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    lastReplaced: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    nextReplacement: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'good',
  },
  {
    id: 'consumable-5',
    type: 'drum',
    name: 'Drum Unit',
    model: 'HP 305A',
    currentLevel: 40,
    maxCapacity: 100,
    activationDate: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
    lastReplaced: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    nextReplacement: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'good',
  },
  {
    id: 'consumable-6',
    type: 'waste_toner',
    name: 'Waste Toner Bottle',
    model: 'HP 305A',
    currentLevel: 85,
    maxCapacity: 100,
    activationDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    lastReplaced: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    nextReplacement: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'low',
  },
]

// Helper functions
export function getUsageHistoryByDevice(_deviceId: string): UsageHistoryItem[] {
  // In real app, this would filter by deviceId
  void _deviceId
  return mockUsageHistory
}

export function getServiceHistoryByDevice(_deviceId: string): ServiceHistoryItem[] {
  // In real app, this would filter by deviceId
  void _deviceId
  return mockServiceHistory
}

export function getConsumablesByDevice(_deviceId: string): ConsumableItem[] {
  // In real app, this would filter by deviceId
  void _deviceId
  return mockConsumables
}
