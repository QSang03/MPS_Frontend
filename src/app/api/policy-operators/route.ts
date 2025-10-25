import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    const hasAccess = !!cookieStore.get('access_token')
    const hasRefresh = !!cookieStore.get('refresh_token')
    console.debug('[api/policy-operators] cookies present:', { hasAccess, hasRefresh })

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Forward query params such as appliesTo to backend
    const url = new URL(request.url)
    const appliesTo = url.searchParams.get('appliesTo') || undefined
    const response = await backendApiClient.get(API_ENDPOINTS.POLICY_OPERATORS, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: appliesTo ? { appliesTo } : undefined,
    })

    // DEBUG: log backend response count/names
    try {
      console.debug(
        '[api/policy-operators] backend returned',
        Array.isArray(response.data)
          ? response.data.length
          : (response.data?.data?.length ?? 'unknown')
      )
    } catch {
      // ignore
    }

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as
      | { message?: string; response?: { status?: number; data?: unknown } }
      | undefined
    console.error('API Route /api/policy-operators GET error:', error)
    if (err?.response)
      console.debug(
        '[api/policy-operators] backend response data:',
        (err.response as { data?: unknown })?.data
      )
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}
