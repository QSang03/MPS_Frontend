import type { Device } from '@/types/models/device'

export interface CustomerOverviewDevice extends Device {
  consumableCount?: number
}

export default CustomerOverviewDevice
