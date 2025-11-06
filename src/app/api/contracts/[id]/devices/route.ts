import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const sp = url.searchParams

    const query: Record<string, unknown> = {}
    if (sp.has('page')) query.page = Number(sp.get('page'))
    if (sp.has('limit')) query.limit = Number(sp.get('limit'))
    if (sp.has('search')) query.search = sp.get('search')
    if (sp.has('sortBy')) query.sortBy = sp.get('sortBy')
    if (sp.has('sortOrder')) query.sortOrder = sp.get('sortOrder')
    if (sp.has('activeMonth')) query.activeMonth = sp.get('activeMonth')

    const response = await backendApiClient.get(`${API_ENDPOINTS.CONTRACTS}/${id}/devices`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: query,
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { status?: number } } | undefined
    console.error('API Route /api/contracts/[id]/devices GET error:', error)
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

    const response = await backendApiClient.post(`${API_ENDPOINTS.CONTRACTS}/${id}/devices`, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { status?: number } } | undefined
    console.error('API Route /api/contracts/[id]/devices POST error:', error)
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

    const response = await backendApiClient.delete(`${API_ENDPOINTS.CONTRACTS}/${id}/devices`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: body,
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { status?: number } } | undefined
    console.error('API Route /api/contracts/[id]/devices DELETE error:', error)
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}
