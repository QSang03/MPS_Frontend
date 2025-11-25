import { DeviceStatus } from '@/constants/status'
import type { Device } from '@/types/models'

// Device Excel Export/Import utilities
export class DeviceExcelService {
  // Export devices to Excel
  static async exportDevices(devices: Device[]): Promise<void> {
    const ExcelJS = (await import('exceljs')).default
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Thiết bị')

    // Define columns
    worksheet.columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Serial Number', key: 'serialNumber', width: 20 },
      { header: 'Model', key: 'model', width: 30 },
      { header: 'Vị trí', key: 'location', width: 25 },
      { header: 'Thuộc sở hữu khách hàng', key: 'isCustomerOwned', width: 18 },
      { header: 'Trạng thái', key: 'status', width: 15 },
      { header: 'Tổng trang đã in', key: 'totalPagesUsed', width: 18 },
      { header: 'Bảo trì cuối', key: 'lastMaintenanceDate', width: 15 },
      { header: 'Bảo trì tiếp theo', key: 'nextMaintenanceDate', width: 18 },
      { header: 'Ngày tạo', key: 'createdAt', width: 15 },
    ]

    // Style header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2E7D32' }, // Green
    }

    // Add data
    devices.forEach((device, index) => {
      const row = worksheet.addRow({
        stt: index + 1,
        serialNumber: device.serialNumber,
        model: device.model,
        location: device.location,
        status: this.getStatusText(device.status),
        totalPagesUsed: device.totalPagesUsed.toLocaleString('vi-VN'),
        lastMaintenanceDate: device.lastMaintenanceDate
          ? new Date(device.lastMaintenanceDate).toLocaleDateString('vi-VN')
          : 'Chưa có',
        nextMaintenanceDate: device.nextMaintenanceDate
          ? new Date(device.nextMaintenanceDate).toLocaleDateString('vi-VN')
          : 'Chưa có',
        createdAt: new Date(device.createdAt).toLocaleDateString('vi-VN'),
      })

      // Alternate row colors
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8F9FA' },
        }
      }
    })

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      if (column.width) {
        column.width = Math.max(column.width || 10, 12)
      }
    })

    // Add borders
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }
      })
    })

    // Generate file
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    // Download
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `thiet-bi-${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Generate import template
  static async generateImportTemplate(): Promise<void> {
    const ExcelJS = (await import('exceljs')).default
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Mẫu nhập thiết bị')

    // Define columns with validation
    worksheet.columns = [
      { header: 'Serial Number *', key: 'serialNumber', width: 20 },
      { header: 'Model *', key: 'model', width: 30 },
      { header: 'Vị trí *', key: 'location', width: 25 },
      { header: 'Thuộc sở hữu khách hàng', key: 'isCustomerOwned', width: 18 },
      { header: 'Trạng thái', key: 'status', width: 15 },
      { header: 'Tổng trang đã in', key: 'totalPagesUsed', width: 18 },
      { header: 'Bảo trì cuối (dd/mm/yyyy)', key: 'lastMaintenanceDate', width: 20 },
      { header: 'Bảo trì tiếp theo (dd/mm/yyyy)', key: 'nextMaintenanceDate', width: 22 },
    ]

    // Style header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1976D2' }, // Blue
    }

    // Add status dropdown validation
    const statusColumn = worksheet.getColumn('status')
    statusColumn.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
      if (rowNumber > 1) {
        cell.dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"Hoạt động,Inactive,Lỗi,Bảo trì"'],
          showErrorMessage: true,
          errorTitle: 'Lỗi',
          error: 'Chọn một trong các trạng thái: Hoạt động, Inactive, Lỗi, Bảo trì',
        }
      }
    })

    // Add sample data
    const sampleData = [
      {
        serialNumber: 'HP-LJ-SAMPLE-001',
        model: 'HP LaserJet Pro MFP M428fdn',
        location: 'Tầng 1, Phòng IT',
        isCustomerOwned: false,
        status: 'Hoạt động',
        totalPagesUsed: '0',
        lastMaintenanceDate: '',
        nextMaintenanceDate: '',
      },
      {
        serialNumber: 'CANON-SAMPLE-002',
        model: 'Canon imageCLASS MF445dw',
        location: 'Tầng 2, Phòng Kế toán',
        isCustomerOwned: true,
        status: 'Hoạt động',
        totalPagesUsed: '1250',
        lastMaintenanceDate: '15/12/2024',
        nextMaintenanceDate: '15/01/2025',
      },
    ]

    sampleData.forEach((data, index) => {
      const row = worksheet.addRow(data)

      // Alternate row colors
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3E5F5' }, // Light purple
        }
      }
    })

    // Add empty row for spacing
    worksheet.addRow([])

    // Add instructions section with better formatting
    const instructionsTitleRow = worksheet.addRow(['HƯỚNG DẪN SỬ DỤNG'])
    instructionsTitleRow.getCell(1).font = {
      bold: true,
      size: 14,
      color: { argb: 'FF1976D2' },
    }
    instructionsTitleRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE3F2FD' }, // Light blue background
    }

    // Merge cells for title
    worksheet.mergeCells('A8:G8')
    instructionsTitleRow.getCell(1).alignment = { horizontal: 'center' }

    const instructionText = [
      '1. Các cột có dấu * là bắt buộc phải nhập',
      '2. Serial Number: Mã số thiết bị duy nhất (không trùng lặp)',
      '3. Model: Tên model thiết bị (ví dụ: HP LaserJet Pro MFP M428fdn)',
      '4. Vị trí: Nơi đặt thiết bị (ví dụ: Tầng 1, Phòng IT)',
      '5. Trạng thái: Chọn từ dropdown hoặc để trống (mặc định: Hoạt động)',
      '6. Tổng trang đã in: Số trang đã in (chỉ nhập số, ví dụ: 1250)',
      '7. Ngày bảo trì: Định dạng dd/mm/yyyy (ví dụ: 15/12/2024)',
    ]

    instructionText.forEach((text, index) => {
      const row = worksheet.addRow([text])
      row.getCell(1).font = { size: 11 }
      row.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8F9FA' }, // Light gray
      }
      // Merge instruction cells
      worksheet.mergeCells(`A${9 + index}:G${9 + index}`)
    })

    // Add note section
    worksheet.addRow([])
    const noteTitleRow = worksheet.addRow(['LƯU Ý QUAN TRỌNG'])
    noteTitleRow.getCell(1).font = {
      bold: true,
      size: 12,
      color: { argb: 'FFD32F2F' },
    }
    noteTitleRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFEBEE' }, // Light red background
    }
    worksheet.mergeCells(`A${17}:G${17}`)
    noteTitleRow.getCell(1).alignment = { horizontal: 'center' }

    const notes = [
      '• File này chỉ để nhập dữ liệu mẫu, không được chỉnh sửa cấu trúc',
      '• Xóa các dòng hướng dẫn trước khi upload file',
      '• Đảm bảo Serial Number không trùng lặp với thiết bị hiện có',
    ]

    notes.forEach((note, index) => {
      const row = worksheet.addRow([note])
      row.getCell(1).font = { size: 10, italic: true }
      row.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF3E0' }, // Light orange
      }
      worksheet.mergeCells(`A${18 + index}:G${18 + index}`)
    })

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      if (column.width) {
        column.width = Math.max(column.width || 10, 12)
      }
    })

    // Add borders
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }
      })
    })

    // Generate file
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    // Download
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mau-nhap-thiet-bi-${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Parse imported Excel file
  static async parseImportedFile(file: File): Promise<Partial<Device>[]> {
    const ExcelJS = (await import('exceljs')).default
    const workbook = new ExcelJS.Workbook()
    const buffer = await file.arrayBuffer()
    await workbook.xlsx.load(buffer)

    const worksheet = workbook.getWorksheet('Mẫu nhập thiết bị')
    if (!worksheet) {
      throw new Error('Không tìm thấy sheet "Mẫu nhập thiết bị"')
    }

    const devices: Partial<Device>[] = []

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return // Skip header

      const serialNumber = row.getCell(1).value
      const model = row.getCell(2).value
      const location = row.getCell(3).value
      const isCustomerOwnedCell = row.getCell(4).value

      // Skip empty rows
      if (!serialNumber || !model || !location) return

      const device: Partial<Device> = {
        serialNumber: String(serialNumber),
        model: String(model),
        location: String(location),
        isCustomerOwned:
          isCustomerOwnedCell === true || String(isCustomerOwnedCell).toLowerCase() === 'true',
        status: this.parseStatus(String(row.getCell(5).value || 'Hoạt động')),
        totalPagesUsed: parseInt(String(row.getCell(6).value || '0')) || 0,
        lastMaintenanceDate: this.parseDate(String(row.getCell(7).value || '')),
        nextMaintenanceDate: this.parseDate(String(row.getCell(8).value || '')),
      }

      devices.push(device)
    })

    return devices
  }

  private static getStatusText(status: Device['status'] | string): string {
    const raw = String(status || '')
    // Normalize: support legacy DeviceStatus enum values (e.g. 'Active') and
    // canonical uppercase values (e.g. 'ACTIVE') returned by backend.
    const key = raw.toUpperCase()
    const mapByKey: Record<string, string> = {
      ACTIVE: 'Hoạt động',
      MAINTENANCE: 'Bảo trì',
      ERROR: 'Lỗi',
      OFFLINE: 'Offline',
      SUSPENDED: 'Tạm ngưng',
      DECOMMISSIONED: 'Decommissioned',
    }
    // Also handle legacy enum names (first-letter capitalized)
    const legacyMap: Record<string, string> = {
      Active: 'Hoạt động',
      Inactive: 'Inactive',
      Error: 'Lỗi',
      Maintenance: 'Bảo trì',
    }

    return mapByKey[key] || legacyMap[raw] || 'Hoạt động'
  }

  private static parseStatus(statusText: string): DeviceStatus {
    const statusMap: Record<string, DeviceStatus> = {
      'Hoạt động': DeviceStatus.ACTIVE,
      Inactive: DeviceStatus.INACTIVE,
      Lỗi: DeviceStatus.ERROR,
      'Bảo trì': DeviceStatus.MAINTENANCE,
    }
    return statusMap[statusText] || DeviceStatus.ACTIVE
  }

  private static parseDate(dateStr: string): string | undefined {
    if (!dateStr || dateStr.trim() === '') return undefined

    try {
      // Handle dd/mm/yyyy format
      const parts = dateStr.split('/')
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        const day = parts[0].padStart(2, '0')
        const month = parts[1].padStart(2, '0')
        const year = parts[2]
        return new Date(`${year}-${month}-${day}`).toISOString()
      }

      // Handle other formats
      const date = new Date(dateStr)
      return isNaN(date.getTime()) ? undefined : date.toISOString()
    } catch {
      return undefined
    }
  }
}
