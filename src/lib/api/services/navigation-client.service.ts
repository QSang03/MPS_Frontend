import internalApiClient from '../internal-client'
import type { NavItemPayload } from '@/constants/navigation'

const navigationClientService = {
  async check(items: NavItemPayload[]) {
    const response = await internalApiClient.post('/api/navigation', { items })
    return response.data
  },
}

export default navigationClientService
