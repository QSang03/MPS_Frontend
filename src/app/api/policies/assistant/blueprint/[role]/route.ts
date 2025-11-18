import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

type RouteParams = {
  role?: string
}

export async function GET(_request: NextRequest, context: { params: Promise<RouteParams> }) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role: roleParam } = await context.params
    const rawRole = roleParam ?? ''
    const role = decodeURIComponent(rawRole)
    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 })
    }

    const response = await backendApiClient.get(API_ENDPOINTS.POLICY_ASSISTANT.BLUEPRINT(role), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as
      | {
          message?: string
          response?: { status?: number; data?: unknown }
        }
      | undefined

    console.error('API Route /api/policies/assistant/blueprint GET error:', {
      message: err?.message,
      status: err?.response?.status,
      responseData: err?.response?.data,
    })

    if (err?.response?.data && typeof err.response.data === 'object') {
      return NextResponse.json(err.response.data as Record<string, unknown>, {
        status: err.response.status || 500,
      })
    }

    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}
