import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolved = await params
    const id = resolved.id
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const resp = await backendApiClient.get(API_ENDPOINTS.LEADS.DETAIL(id), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return NextResponse.json(resp.data)
  } catch (error: unknown) {
    const err = error as
      | { message?: string; response?: { status?: number; data?: unknown } }
      | undefined
    console.error('API Route /api/leads/[id] GET error:', err?.message || error)
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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolved = await params
    const id = resolved.id
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const resp = await backendApiClient.patch(API_ENDPOINTS.LEADS.UPDATE(id), body, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return NextResponse.json(resp.data)
  } catch (error: unknown) {
    const err = error as
      | { message?: string; response?: { status?: number; data?: unknown } }
      | undefined
    console.error('API Route /api/leads/[id] PATCH error:', err?.message || error)
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolved = await params
    const id = resolved.id
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const resp = await backendApiClient.delete(API_ENDPOINTS.LEADS.DELETE(id), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return NextResponse.json(resp.data)
  } catch (error: unknown) {
    const err = error as
      | { message?: string; response?: { status?: number; data?: unknown } }
      | undefined
    console.error('API Route /api/leads/[id] DELETE error:', err?.message || error)
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
