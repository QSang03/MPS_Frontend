import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

type ApiErr = { response?: { data?: unknown; status?: number }; message?: string }

export async function GET() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Call backend API to get current user's profile
    const response = await backendApiClient.get(API_ENDPOINTS.AUTH.PROFILE, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as { response?: { status?: number }; message?: string }
    console.error('API Route /api/profile error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: err.response?.status || 500 }
    )
  }
}

/**
 * PATCH /api/profile
 * Update current user's profile (including language preference)
 * Backend endpoint: PATCH /auth/profile
 */
export async function PATCH(request: NextRequest) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Forward query params from client (including lang if provided)
    const searchParams = request.nextUrl.searchParams
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })

    // Call backend API to update current user profile
    // Backend endpoint for updating is /auth/profile (PATCH)
    const response = await backendApiClient.patch('/auth/profile', body, {
      params,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as unknown as ApiErr
    console.error('API Route /api/profile PATCH error:', err)
    const backendData = err?.response?.data
    const status = err?.response?.status || 500
    if (backendData) {
      return NextResponse.json(backendData, { status })
    }
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status })
  }
}
