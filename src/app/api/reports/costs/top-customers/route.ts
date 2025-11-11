import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'

/**
 * GET /api/reports/costs/top-customers
 * Proxy to backend /reports/costs/top-customers
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = searchParams.get('page') ?? '1'
    const limit = searchParams.get('limit') ?? '20'
    const month = searchParams.get('month') ?? undefined
    const search = searchParams.get('search') ?? undefined
    const sortBy = searchParams.get('sortBy') ?? undefined
    const sortOrder = searchParams.get('sortOrder') ?? undefined

    const params: Record<string, unknown> = {
      page: Number(page),
      limit: Number(limit),
    }
    if (month) params.month = month
    if (search) params.search = search
    if (sortBy) params.sortBy = sortBy
    if (sortOrder) params.sortOrder = sortOrder

    const response = await backendApiClient.get('/reports/costs/top-customers', {
      params,
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const axiosError = error as { message?: string; response?: { status?: number; data?: unknown } }
    console.error('[api/reports/costs/top-customers] Error:', axiosError.message)

    if (axiosError.response?.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const backendData = axiosError.response?.data
    if (backendData && typeof backendData === 'object') {
      return NextResponse.json(backendData, { status: axiosError.response?.status || 500 })
    }

    return NextResponse.json(
      { error: axiosError.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
