import internalApiClient from '../internal-client'
import type { Contract, CreateContractDto, UpdateContractDto } from '@/types/models/contract'
import type { ApiListResponse, ListPagination } from '@/types/api'
import type {
  ContractDevice,
  AttachDevicesDto,
  DetachDevicesDto,
} from '@/types/models/contract-device'

export const contractsClientService = {
  async getAll(params?: {
    page?: number
    limit?: number
    search?: string
    type?: string
    status?: string
    customerId?: string
    startDateFrom?: string
    endDateTo?: string
    sortBy?: string
    sortOrder?: string
  }): Promise<{ data: Contract[]; pagination?: ListPagination }> {
    const response = await internalApiClient.get<ApiListResponse<Contract>>('/api/contracts', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 100,
        search: params?.search,
        type: params?.type,
        status: params?.status,
        customerId: params?.customerId,
        startDateFrom: params?.startDateFrom,
        endDateTo: params?.endDateTo,
        sortBy: params?.sortBy,
        sortOrder: params?.sortOrder,
      },
    })

    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  async getByCustomer(
    customerId: string,
    params?: {
      page?: number
      limit?: number
      search?: string
      sortBy?: string
      sortOrder?: string
    }
  ): Promise<{ data: Contract[]; pagination?: ListPagination }> {
    const response = await internalApiClient.get<ApiListResponse<Contract>>(
      `/api/customers/${customerId}/contracts`,
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 100,
          search: params?.search,
          sortBy: params?.sortBy,
          sortOrder: params?.sortOrder,
        },
      }
    )
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  async create(payload: CreateContractDto): Promise<Contract | null> {
    const response = await internalApiClient.post('/api/contracts', payload)
    return response.data?.data ?? null
  },

  async getById(id: string): Promise<Contract | null> {
    const response = await internalApiClient.get(`/api/contracts/${id}`)
    return response.data?.data ?? null
  },

  async update(id: string, payload: UpdateContractDto): Promise<Contract | null> {
    const response = await internalApiClient.patch(`/api/contracts/${id}`, payload)
    return response.data?.data ?? null
  },

  async delete(id: string): Promise<boolean> {
    const response = await internalApiClient.delete(`/api/contracts/${id}`)
    return response.status === 200 || response.data?.success === true
  },

  /**
   * Attach devices to a contract
   */
  async attachDevices(
    contractId: string,
    payload: AttachDevicesDto
  ): Promise<ContractDevice | ContractDevice[] | null> {
    const response = await internalApiClient.post(`/api/contracts/${contractId}/devices`, payload)
    return response.data?.data ?? null
  },

  /**
   * Detach devices from a contract
   */
  async detachDevices(contractId: string, payload: DetachDevicesDto): Promise<boolean> {
    const response = await internalApiClient.delete(`/api/contracts/${contractId}/devices`, {
      data: payload,
    })
    return response.status === 200 || response.data?.success === true
  },

  /**
   * List devices attached to a contract with optional pagination and filters
   */
  async listDevices(
    contractId: string,
    params?: {
      page?: number
      limit?: number
      search?: string
      sortBy?: string
      sortOrder?: string
      activeMonth?: string
    }
  ): Promise<{ data: ContractDevice[]; pagination?: ListPagination }> {
    const response = await internalApiClient.get<ApiListResponse<ContractDevice>>(
      `/api/contracts/${contractId}/devices`,
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          search: params?.search,
          sortBy: params?.sortBy,
          sortOrder: params?.sortOrder,
          activeMonth: params?.activeMonth,
        },
      }
    )

    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },
}

export default contractsClientService
