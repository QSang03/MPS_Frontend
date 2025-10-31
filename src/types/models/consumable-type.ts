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
}

export interface CreateConsumableTypeDto {
  name: string
  description?: string
  unit?: string
  partNumber?: string
  capacity?: number
  isActive?: boolean
}

export type UpdateConsumableTypeDto = Partial<CreateConsumableTypeDto>
