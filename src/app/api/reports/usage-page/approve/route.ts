import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    let payload: unknown
    try {
      payload = await request.json()
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid JSON payload' }, { status: 400 })
    }

    const upstream = await backendApiClient.post('/reports/usage-page/approve', payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    // Handle successful response - backend may return data directly or wrapped
    // If upstream.data exists, use it; otherwise use the whole response object
    const responseData = upstream.data !== undefined ? upstream.data : { success: true }
    const status = upstream.status || 200

    return NextResponse.json(responseData, { status })
  } catch (error: unknown) {
    const err = error as {
      response?: { status?: number; data?: unknown; statusText?: string }
      message?: string
    }

    // If backend returned an error response, forward it
    if (err?.response) {
      const status = err.response.status || 500
      const body =
        err.response.data && typeof err.response.data === 'object'
          ? err.response.data
          : {
              success: false,
              message: err.response.statusText || err?.message || 'Approve usage page failed',
            }
      return NextResponse.json(body as Record<string, unknown>, { status })
    }

    // Handle other errors (network, parsing, etc.)
    console.error('[usage-page/approve] Error:', {
      message: err?.message,
      response: err?.response,
      stack: err instanceof Error ? err.stack : undefined,
    })

    return NextResponse.json(
      {
        success: false,
        message: err?.message || 'Unknown error',
        error: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
      },
      { status: 500 }
    )
  }
}
