import internalApiClient from '../internal-client'

export type UsagePageProcessData = {
  deviceId?: string
  totalPageCount?: number
  totalColorPages?: number
  totalBlackWhitePages?: number
  recordedAt?: string
}

export type UsagePageDeviceInfo = {
  id?: string
  serialNumber?: string
  deviceModel?: { name?: string }
  customer?: { name?: string }
  location?: string
}

export type UsagePageProcessResponse = {
  success?: boolean
  message?: string
  data?: {
    data?: UsagePageProcessData
    device?: UsagePageDeviceInfo | null
  }
}

export type UsagePageApprovePayload = {
  deviceId: string
  totalPageCount: number
  totalColorPages: number
  totalBlackWhitePages: number
  recordedAt: string
}

export const usagePageService = {
  async process(
    file: File | Blob,
    extra?: Record<string, string>
  ): Promise<UsagePageProcessResponse> {
    const form = new FormData()
    form.append('file', file)
    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        if (value !== undefined && value !== null) form.append(key, value)
      })
    }

    const res = await internalApiClient.post<UsagePageProcessResponse>(
      '/api/reports/usage-page/process',
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )
    return res.data
  },

  async approve(
    payload: UsagePageApprovePayload
  ): Promise<{ success?: boolean; message?: string }> {
    const res = await internalApiClient.post('/api/reports/usage-page/approve', payload)
    return res.data
  },
}

export default usagePageService
