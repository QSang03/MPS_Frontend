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

    // Defensive: some UI flows open a modal after selecting a new status
    // and (by mistake) may send a payload without the `status` field.
    // Infer status from other fields when possible so backend receives
    // a canonical update payload.
    const normalizedBody = { ...(body ?? {}) } as Record<string, unknown>
    if (!('status' in normalizedBody) || normalizedBody.status == null) {
      // If the client indicates a customer-initiated close or provides a close reason/closedAt,
      // treat it as CLOSED. If resolvedAt is present, treat it as RESOLVED.
      if (
        normalizedBody.customerInitiatedClose === true ||
        typeof normalizedBody.customerCloseReason === 'string' ||
        typeof normalizedBody.closedAt === 'string'
      ) {
        normalizedBody.status = 'CLOSED'
      } else if (typeof normalizedBody.resolvedAt === 'string') {
        normalizedBody.status = 'RESOLVED'
      }
    }

    const response = await backendApiClient.patch(
      API_ENDPOINTS.SERVICE_REQUESTS.STATUS(id),
      normalizedBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as
      | { message?: string; response?: { status?: number; data?: unknown } }
      | undefined

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
