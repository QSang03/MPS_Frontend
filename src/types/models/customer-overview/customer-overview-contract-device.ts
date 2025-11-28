import type { ContractDevice } from '@/types/models/contract-device'

export interface CustomerOverviewContractDevice extends ContractDevice {
  totalPageCount?: number | null
  totalColorPages?: number | null
  totalBlackWhitePages?: number | null
  totalPageCountA4?: number | null
  totalColorPagesA4?: number | null
  totalBlackWhitePagesA4?: number | null
}

export default CustomerOverviewContractDevice
