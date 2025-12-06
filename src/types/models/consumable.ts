import type { ConsumableType, StockItem } from './consumable-type'
import type { CurrencyDataDto } from './currency'

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
  price?: number | null
  currencyId?: string | null
  currency?: CurrencyDataDto | null
  currentExchangeRate?: number | null
  status?: string
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
  currencyId?: string | null
  currency?: CurrencyDataDto | null
  currentExchangeRate?: number | null
  createdAt?: string | null
  updatedAt?: string | null
  /** Warning threshold percentage for this consumable installed on the device (0-100) */
  warningPercentage?: number | null
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
  price?: number | null
  currencyId?: string | null
  currencyCode?: string
}
