import type { ConsumableType, StockItem } from './consumable-type'

export interface Consumable {
  id: string
  serialNumber?: string | null
  batchNumber?: string | null
  capacity?: number | null
  remaining?: number | null
  expiryDate?: string | null
  consumableTypeId?: string
  consumableType?: ConsumableType
  /** Pricing fields coming from API */
  priceVND?: number | null
  priceUSD?: number | null
  exchangeRate?: number | null
  status?: string
  price?: number | null
  createdAt?: string
  updatedAt?: string
}

// The device-consumable linking table shape returned by /api/devices/:id/consumables
export interface DeviceConsumable {
  id?: string
  consumableId?: string
  consumable?: Consumable | null
  /** Whether this consumable record is currently active/installed on the device */
  isActive?: boolean | null
  serialNumber?: string | null
  batchNumber?: string | null
  consumableType?: ConsumableType | null
  consumableTypeId?: string | null
  capacity?: number | null
  remaining?: number | null
  installedAt?: string | null
  removedAt?: string | null
  actualPagesPrinted?: number | null
  expiryDate?: string | null
  status?: string
  price?: number | null
  priceVND?: number | null
  priceUSD?: number | null
  exchangeRate?: number | null
  createdAt?: string | null
  updatedAt?: string | null
}

// Compatible consumable responses: either bare ConsumableType or a wrapper that also includes stock info
export type CompatibleConsumable =
  | ConsumableType
  | {
      consumableType: ConsumableType
      stockItem?: StockItem
      customerStockQuantity?: number
    }

export interface CreateDeviceConsumableDto {
  consumableTypeId?: string
  serialNumber?: string
  batchNumber?: string
  capacity?: number
  remaining?: number
  expiryDate?: string
}

export interface UpdateDeviceConsumableDto {
  consumableTypeId?: string
  serialNumber?: string
  batchNumber?: string
  capacity?: number | null
  remaining?: number | null
  expiryDate?: string | null
  installedAt?: string | null
  removedAt?: string | null
  actualPagesPrinted?: number | null
  priceVND?: number | null
  priceUSD?: number | null
  exchangeRate?: number | null
  price?: number | null
}
