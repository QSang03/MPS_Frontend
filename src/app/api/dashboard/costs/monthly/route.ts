import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'

/**
 * GET /api/dashboard/costs/monthly
 * Proxy to backend: GET /dashboard/costs/monthly?month=YYYY-MM
 * Backend will scope by customerId from JWT session.
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')

    if (!month) {
      return NextResponse.json({ error: 'month is required' }, { status: 400 })
    }

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 })
    }

    console.log('[api/dashboard/costs/monthly] Fetching for month:', month)

    const response = await backendApiClient.get('/dashboard/costs/monthly', {
      params: { month },
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    console.error('[api/dashboard/costs/monthly] Error:', error)

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status: number; data?: unknown } }
      return NextResponse.json(
        axiosError.response?.data || { error: 'Failed to fetch monthly costs' },
        { status: axiosError.response?.status || 500 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
