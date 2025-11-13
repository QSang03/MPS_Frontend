import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'

/**
 * GET /api/dashboard/overview
 * Fetch dashboard overview for the logged-in user's customer for a month
 * Query params: month (required, format: YYYY-MM)
 * Backend extracts customerId from JWT token
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

    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 })
    }

    console.log('[api/dashboard/overview] Fetching for month:', month, '(customerId from session)')

    // Call backend API (backend extracts customerId from JWT)
    const response = await backendApiClient.get('/dashboard/overview', {
      params: { month },
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    console.log('[api/dashboard/overview] Backend response status:', response.status)

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    console.error('[api/dashboard/overview] Error:', error)

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status: number; data?: unknown } }
      return NextResponse.json(
        axiosError.response?.data || { error: 'Failed to fetch customer overview' },
        { status: axiosError.response?.status || 500 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
