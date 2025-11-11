export interface StockItem {
  id: string
  consumableTypeId: string
  quantity: number
  lowStockThreshold: number
  createdAt?: string
  updatedAt?: string
}

export interface ConsumableType {
  id: string
  name?: string
  description?: string
  unit?: string
  partNumber?: string
  capacity?: number
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
  stockItem?: StockItem
  compatibleDeviceModels?: Array<{ id: string; name: string }>
  compatibleMachineLine?: string
}

export interface CreateConsumableTypeDto {
  name: string
  description?: string
  unit?: string
  partNumber?: string
  capacity?: number
  isActive?: boolean
  compatibleMachineLine?: string
}

export type UpdateConsumableTypeDto = Partial<CreateConsumableTypeDto>
