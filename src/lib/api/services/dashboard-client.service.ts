import internalApiClient from '../internal-client'

export const dashboardClientService = {
  /**
   * Get dashboard overview for a customer and month
   * GET /api/dashboard/overview?customerId=...&month=YYYY-MM
   */
  async getOverview(customerId: string, month: string) {
    const response = await internalApiClient.get('/api/dashboard/overview', {
      params: { customerId, month },
    })

    const body = response.data
    if (!body) throw new Error('Empty response')

    // Normalize possible wrapped response
    if (body.data) return body.data
    return body
  },
}

export default dashboardClientService
