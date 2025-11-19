import type { ConsumableType } from '@/types/models/consumable-type'
import type { Customer } from '@/types/models/customer'

export interface CustomerOverviewConsumable {
  id: string
  consumableTypeId: string
  customerId: string
  serialNumber?: string
  status?: string
  moveOnStatus?: string
  transitStartDate?: string | null
  estimatedArrivalDate?: string | null
  actualArrivalDate?: string | null
  returnReason?: string | null
  returnNotes?: string | null
  expiryDate?: string | null
  createdAt?: string
  updatedAt?: string
  deviceCount?: number
  activeDeviceIds?: string[]
  consumableType?: ConsumableType
  customer?: Customer
}

export default CustomerOverviewConsumable
