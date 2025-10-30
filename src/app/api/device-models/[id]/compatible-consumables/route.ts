import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const response = await backendApiClient.get(
      API_ENDPOINTS.DEVICE_MODELS.COMPATIBLE_CONSUMABLES(id),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { status?: number } } | undefined
    console.error('API Route /api/device-models/[id]/compatible-consumables GET error:', error)
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const response = await backendApiClient.post(
      API_ENDPOINTS.DEVICE_MODELS.COMPATIBLE_CONSUMABLES(id),
      body,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { status?: number } } | undefined
    console.error('API Route /api/device-models/[id]/compatible-consumables POST error:', error)
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    await backendApiClient.delete(API_ENDPOINTS.DEVICE_MODELS.COMPATIBLE_CONSUMABLES(id), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: body,
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    // If backend returned an axios error with response payload, handle business errors specially
    const errAny = error as any

    if (errAny?.response && typeof errAny.response === 'object') {
      const status = errAny.response.status || 500
      const data = errAny.response.data ?? { error: errAny.message || 'Internal Server Error' }

      // Map known business error 'COMPATIBILITY_IN_USE' to 200 (OK)
      // Return 200 with the business payload so Next dev overlay won't treat it as an internal server error.
      // The client can still inspect the returned payload.error to show an appropriate message.
      if (data && data.error === 'COMPATIBILITY_IN_USE') {
        console.debug(
          'API Route /api/device-models/[id]/compatible-consumables DELETE business error mapped to 200 (business conflict):',
          data
        )
        return NextResponse.json(data, { status: 200 })
      }

      // Otherwise forward original backend status and payload
      console.error(
        'API Route /api/device-models/[id]/compatible-consumables DELETE error:',
        'status=',
        status,
        'data=',
        data
      )
      return NextResponse.json(data, { status })
    }

    console.error(
      'API Route /api/device-models/[id]/compatible-consumables DELETE error: ',
      errAny?.message || errAny
    )
    return NextResponse.json(
      { error: (errAny && errAny.message) || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
