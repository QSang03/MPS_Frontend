import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

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
