import type { Contract } from '@/types/models/contract'
import type { CustomerOverviewContractDevice } from './customer-overview-contract-device'

export interface CustomerOverviewContract extends Contract {
  contractDevices?: CustomerOverviewContractDevice[]
}

export default CustomerOverviewContract
