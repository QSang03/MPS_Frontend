import type { Device } from '@/types/models/device'

export interface ContractDevice {
  id: string
  contractId: string
  deviceId: string
  monthlyRent?: number | null
  activeFrom?: string | null
  activeTo?: string | null
  createdAt?: string
  updatedAt?: string
  device?: Device
}

export interface AttachDeviceItem {
  deviceId: string
  monthlyRent?: number | null
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
