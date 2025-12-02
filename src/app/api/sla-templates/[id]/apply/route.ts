import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { statusCode: 400, message: 'template id is required', error: 'BAD_REQUEST' },
        { status: 400 }
      )
    }
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Forward POST body to backend. Expecting { customerId: string, skipExisting?: boolean }
    let body: unknown = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    // Validate required field before contacting backend to avoid server-side errors
    if (!body || typeof body !== 'object' || !(body as Record<string, unknown>)['customerId']) {
      return NextResponse.json(
        {
          statusCode: 400,
          message: 'customerId is required in request body',
          error: 'BAD_REQUEST',
        },
        { status: 400 }
      )
    }

    const response = await backendApiClient.post(API_ENDPOINTS.SLA_TEMPLATES.APPLY(id), body, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as
      | { message?: string; response?: { status?: number; data?: unknown } }
      | undefined
    console.error('API Route /api/sla-templates/[id]/apply POST error:', error)
    if (err?.response?.data && typeof err.response.data === 'object') {
      return NextResponse.json(err.response.data as unknown as Record<string, unknown>, {
        status: err?.response?.status || 500,
      })
    }
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}
