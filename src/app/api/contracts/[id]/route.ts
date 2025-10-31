import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { removeEmpty } from '@/lib/utils/clean'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const response = await backendApiClient.get(`${API_ENDPOINTS.CONTRACTS}/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { status?: number } } | undefined
    console.error('API Route /api/contracts/[id] GET error:', error)
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const cleaned = removeEmpty(body as Record<string, unknown>)

    const response = await backendApiClient.patch(`${API_ENDPOINTS.CONTRACTS}/${id}`, cleaned, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { status?: number } } | undefined
    console.error('API Route /api/contracts/[id] PATCH error:', error)
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

    await backendApiClient.delete(`${API_ENDPOINTS.CONTRACTS}/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { status?: number } } | undefined
    console.error('API Route /api/contracts/[id] DELETE error:', error)
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}
