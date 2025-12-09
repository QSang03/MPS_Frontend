import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

function buildParams(searchParams: URLSearchParams) {
  const params: Record<string, string> = {}
  for (const [key, value] of searchParams.entries()) {
    const v = String(value ?? '').trim()
    if (!v || v === 'null' || v === 'undefined') continue
    params[key] = v
  }
  return params
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const params = buildParams(request.nextUrl.searchParams)
    const response = await backendApiClient.get(API_ENDPOINTS.COST_ADJUSTMENTS.LIST, {
      params,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const e = error as { response?: { status?: number; data?: unknown }; message?: string }
    console.error('[API] cost-adjustments GET error:', e?.message, e?.response?.data)
    const status = e?.response?.status || 500
    return NextResponse.json(
      {
        success: false,
        message: e?.message || 'Failed to fetch cost adjustments',
        error: process.env.NODE_ENV === 'development' ? e?.response?.data : undefined,
      },
      { status }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const response = await backendApiClient.post(API_ENDPOINTS.COST_ADJUSTMENTS.LIST, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return NextResponse.json(response.data, { status: 201 })
  } catch (error: unknown) {
    const e = error as { response?: { status?: number; data?: unknown }; message?: string }
    console.error('[API] cost-adjustments POST error:', e?.message, e?.response?.data)
    const status = e?.response?.status || 500
    return NextResponse.json(
      {
        success: false,
        message: e?.message || 'Failed to create cost adjustment',
        error: process.env.NODE_ENV === 'development' ? e?.response?.data : undefined,
      },
      { status }
    )
  }
}
