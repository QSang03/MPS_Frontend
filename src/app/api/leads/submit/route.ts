import { NextRequest, NextResponse } from 'next/server'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const resp = await backendApiClient.post(API_ENDPOINTS.LEADS.CREATE, body)

    return NextResponse.json(resp.data)
  } catch (error: unknown) {
    const err = error as
      | { message?: string; response?: { status?: number; data?: unknown } }
      | undefined
    console.error('API Route /api/leads/submit error:', err?.message || error)

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
