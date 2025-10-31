import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = (await params) as { id: string }
    const body = await request.json()

    const response = await backendApiClient.post(
      API_ENDPOINTS.DEVICES.ASSIGN_TO_CUSTOMER(id),
      body,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as
      | { message?: string; response?: { status?: number; data?: unknown } }
      | undefined
    console.error(
      '/api/devices/[id]/assign-to-customer error:',
      err?.response?.status || err?.message
    )
    return NextResponse.json(
      (err?.response?.data as unknown) || { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}
