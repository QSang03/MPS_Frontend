import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'

/**
 * GET /api/dashboard/overview
 * Fetch customer-specific dashboard overview for a month
 * Query params: customerId (required), month (required, format: YYYY-MM)
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const month = searchParams.get('month')

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 })
    }

    if (!month) {
      return NextResponse.json({ error: 'month is required' }, { status: 400 })
    }

    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 })
    }

    console.log('[api/dashboard/overview] Fetching with customerId:', customerId, 'month:', month)

    // Call backend API
    const response = await backendApiClient.get('/dashboard/overview', {
      params: { customerId, month },
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
