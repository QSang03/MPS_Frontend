import internalApiClient from '../internal-client'

export const dashboardClientService = {
  /**
   * Get dashboard overview for the current session's customer (backend scopes by session) and month
   * GET /api/dashboard/overview?month=YYYY-MM
   */
  async getOverview(month: string) {
    const response = await internalApiClient.get('/api/dashboard/overview', {
      params: { month },
    })

    const body = response.data
    if (!body) throw new Error('Empty response')

    // Normalize possible wrapped response
    if (body.data) return body.data
    return body
  },

  /**
   * Get monthly costs for the current session's customer
   * GET /api/dashboard/costs/monthly?month=YYYY-MM
   */
  async getMonthlyCosts(month: string) {
    const response = await internalApiClient.get('/api/dashboard/costs/monthly', {
      params: { month },
    })

    const body = response.data
    if (!body) throw new Error('Empty response')
    if (body.data) return body.data
    return body
  },
}

export default dashboardClientService
