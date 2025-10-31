import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const response = await backendApiClient.patch(API_ENDPOINTS.STOCK_ITEMS.UPDATE(id), body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const e = error as { response?: { data?: unknown; status?: number }; message?: string }
    console.error('[api/stock-items/[id]] PATCH error:', e.response?.data || e.message)
    return NextResponse.json(
      { error: e.response?.data || e.message || 'Failed to update stock item' },
      { status: e.response?.status || 500 }
    )
  }
}
