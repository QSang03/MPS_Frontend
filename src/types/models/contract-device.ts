import type { Device } from '@/types/models/device'
import type { CurrencyDataDto } from './currency'

export interface ContractDevice {
  id: string
  contractId: string
  deviceId: string
  monthlyRent?: number | null
  monthlyRentCogs?: number | null
  currencyId?: string | null
  currency?: CurrencyDataDto | null
  currentExchangeRate?: number | null
  pricePerBWPage?: number | null
  pricePerColorPage?: number | null
  activeFrom?: string | null
  activeTo?: string | null
  createdAt?: string
  updatedAt?: string
  device?: Device
}

export interface AttachDeviceItem {
  deviceId: string
  monthlyRent?: number | null
  monthlyRentCogs?: number | null
  currencyId?: string | null
  activeFrom?: string | null
  activeTo?: string | null
}

export interface AttachDevicesDto {
  items: AttachDeviceItem[]
}

export interface DetachDevicesDto {
  deviceIds: string[]
}

export default ContractDevice
