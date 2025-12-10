import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 })
    }

    const response = await backendApiClient.get(API_ENDPOINTS.COST_ADJUSTMENTS.DETAIL(id), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const e = error as { response?: { status?: number; data?: unknown }; message?: string }
    console.error('[API] cost-adjustments/:id GET error:', e?.message, e?.response?.data)
    const status = e?.response?.status || 500
    return NextResponse.json(
      {
        success: false,
        message: e?.message || 'Failed to fetch cost adjustment',
        error: process.env.NODE_ENV === 'development' ? e?.response?.data : undefined,
      },
      { status }
    )
  }
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 })
    }

    const body = await request.json()
    const response = await backendApiClient.patch(API_ENDPOINTS.COST_ADJUSTMENTS.DETAIL(id), body, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const e = error as { response?: { status?: number; data?: unknown }; message?: string }
    console.error('[API] cost-adjustments/:id PATCH error:', e?.message, e?.response?.data)
    const status = e?.response?.status || 500
    return NextResponse.json(
      {
        success: false,
        message: e?.message || 'Failed to update cost adjustment',
        error: process.env.NODE_ENV === 'development' ? e?.response?.data : undefined,
      },
      { status }
    )
  }
}
