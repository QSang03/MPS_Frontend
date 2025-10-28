/**
 * DeviceModel type — extracted for device models management
 */
export interface DeviceModel {
  id: string
  partNumber?: string
  name?: string
  manufacturer?: string
  type?: string
  description?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateDeviceModelDto {
  partNumber?: string
  name?: string
  manufacturer?: string
  type?: string
  description?: string
  isActive?: boolean
}

export type UpdateDeviceModelDto = Partial<CreateDeviceModelDto>
