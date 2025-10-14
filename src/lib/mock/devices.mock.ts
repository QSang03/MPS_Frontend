import { DeviceStatus } from '@/constants/status'
import type { Device } from '@/types/models'

/**
 * Mock device data for development
 */
export const mockDevices: Device[] = [
  {
    id: 'dev-1',
    serialNumber: 'HP-LJ-PRO-001',
    model: 'HP LaserJet Pro MFP M428fdn',
    location: 'Tầng 3, Phòng IT',
    status: DeviceStatus.ACTIVE,
    customerId: 'customer-1',
    totalPagesUsed: 125450,
    lastMaintenanceDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    nextMaintenanceDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'dev-2',
    serialNumber: 'HP-LJ-ENT-002',
    model: 'HP LaserJet Enterprise M507dn',
    location: 'Tầng 2, Phòng Kế toán',
    status: DeviceStatus.ACTIVE,
    customerId: 'customer-1',
    totalPagesUsed: 87230,
    lastMaintenanceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    nextMaintenanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'dev-3',
    serialNumber: 'CANON-IR-003',
    model: 'Canon imageRUNNER ADVANCE C5535i',
    location: 'Tầng 1, Phòng Hành chính',
    status: DeviceStatus.ERROR,
    customerId: 'customer-1',
    totalPagesUsed: 234890,
    lastMaintenanceDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    nextMaintenanceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'dev-4',
    serialNumber: 'EPSON-WF-004',
    model: 'Epson WorkForce Pro WF-C5790',
    location: 'Tầng 4, Phòng Marketing',
    status: DeviceStatus.ACTIVE,
    customerId: 'customer-1',
    totalPagesUsed: 45678,
    lastMaintenanceDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    nextMaintenanceDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'dev-5',
    serialNumber: 'XEROX-VLC-005',
    model: 'Xerox VersaLink C7025',
    location: 'Tầng 3, Phòng Thiết kế',
    status: DeviceStatus.MAINTENANCE,
    customerId: 'customer-1',
    totalPagesUsed: 156789,
    lastMaintenanceDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    nextMaintenanceDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'dev-6',
    serialNumber: 'BROTHER-HL-006',
    model: 'Brother HL-L8360CDW',
    location: 'Tầng 2, Phòng Nhân sự',
    status: DeviceStatus.ACTIVE,
    customerId: 'customer-1',
    totalPagesUsed: 67890,
    lastMaintenanceDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    nextMaintenanceDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'dev-7',
    serialNumber: 'HP-CLJ-007',
    model: 'HP Color LaserJet Pro M454dw',
    location: 'Tầng 5, Phòng Giám đốc',
    status: DeviceStatus.ACTIVE,
    customerId: 'customer-1',
    totalPagesUsed: 34567,
    lastMaintenanceDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    nextMaintenanceDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'dev-8',
    serialNumber: 'RICOH-SP-008',
    model: 'Ricoh SP C261DNw',
    location: 'Tầng 1, Phòng Tiếp tân',
    status: DeviceStatus.INACTIVE,
    customerId: 'customer-1',
    totalPagesUsed: 12345,
    lastMaintenanceDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    nextMaintenanceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'dev-9',
    serialNumber: 'CANON-MF-009',
    model: 'Canon imageCLASS MF644Cdw',
    location: 'Tầng 4, Phòng Kinh doanh',
    status: DeviceStatus.ACTIVE,
    customerId: 'customer-1',
    totalPagesUsed: 98765,
    lastMaintenanceDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    nextMaintenanceDate: new Date(Date.now() + 48 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'dev-10',
    serialNumber: 'LEXMARK-MS-010',
    model: 'Lexmark MS431dw',
    location: 'Tầng 3, Phòng R&D',
    status: DeviceStatus.ERROR,
    customerId: 'customer-1',
    totalPagesUsed: 54321,
    lastMaintenanceDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    nextMaintenanceDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 130 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

/**
 * Get mock devices with pagination
 */
export function getMockDevices(page: number = 1, limit: number = 10) {
  const start = (page - 1) * limit
  const end = start + limit

  return {
    items: mockDevices.slice(start, end),
    totalCount: mockDevices.length,
    page,
    limit,
    totalPages: Math.ceil(mockDevices.length / limit),
  }
}

/**
 * Get device statistics
 */
export function getMockDeviceStats() {
  return {
    total: mockDevices.length,
    active: mockDevices.filter((d) => d.status === DeviceStatus.ACTIVE).length,
    error: mockDevices.filter((d) => d.status === DeviceStatus.ERROR).length,
    inactive: mockDevices.filter((d) => d.status === DeviceStatus.INACTIVE).length,
    maintenance: mockDevices.filter((d) => d.status === DeviceStatus.MAINTENANCE).length,
  }
}
