import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Forward query params excluding lang
    const searchParams = request.nextUrl.searchParams
    const params: Record<string, string | number | undefined> = {}
    searchParams.forEach((value, key) => {
      if (key === 'lang') return
      params[key] = value
    })

    const response = await backendApiClient.get(API_ENDPOINTS.LEADS.LIST, {
      params,
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as
      | { message?: string; response?: { status?: number; data?: unknown } }
      | undefined
    console.error('API Route /api/leads GET error:', err?.message || error)
    if (err?.response?.data && typeof err.response.data === 'object') {
      return NextResponse.json(err.response.data as Record<string, unknown>, {
        status: err?.response?.status || 500,
      })
    }
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}
