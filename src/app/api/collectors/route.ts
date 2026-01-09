import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Forward query params from client
    const searchParams = request.nextUrl.searchParams
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      if (key !== 'lang') {
        params[key] = value
      }
    })

    const response = await backendApiClient.get(API_ENDPOINTS.COLLECTORS.LIST, {
      params,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as
      | { message?: string; response?: { status?: number; data?: unknown } }
      | undefined
    console.error('API Route /api/collectors error:', error)
    return NextResponse.json(
      err?.response?.data || { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const reqBody = await request.json()

    const response = await backendApiClient.post(API_ENDPOINTS.COLLECTORS.CREATE, reqBody, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as
      | {
          message?: string
          response?: { status?: number; data?: unknown }
        }
      | undefined
    console.error('API Route /api/collectors POST error:', err?.response?.status || err?.message)
    return NextResponse.json(
      err?.response?.data || { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}
