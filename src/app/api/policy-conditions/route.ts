import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
// backendApiClient is not used here; this route uses `getWithRefresh` helper
import { getWithRefresh } from '@/lib/api/server-proxy'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    let accessToken = cookieStore.get('access_token')?.value
    const hasAccess = !!cookieStore.get('access_token')
    const hasRefresh = !!cookieStore.get('refresh_token')
    // Allow Authorization header as a fallback for API clients/tests (Bearer token)
    if (!accessToken) {
      const authHeader =
        request.headers.get('authorization') || request.headers.get('Authorization')
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        accessToken = authHeader.slice(7).trim()
      }
    }

    console.debug('[api/policy-conditions] cookies present:', { hasAccess, hasRefresh })

    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const params: Record<string, string | number | boolean> = {}
    const page = url.searchParams.get('page')
    const limit = url.searchParams.get('limit')
    const search = url.searchParams.get('search')
    const isActive = url.searchParams.get('isActive')
    const dataType = url.searchParams.get('dataType')
    if (page) params.page = Number(page)
    if (limit) {
      const limitNum = Number(limit)
      // Backend giới hạn tối đa 100
      params.limit = limitNum > 100 ? 100 : limitNum
    }
    if (search) params.search = search
    if (typeof isActive === 'string') params.isActive = isActive === 'true'
    if (dataType) params.dataType = dataType

    try {
      console.log('[api/policy-conditions] Calling backend with params:', params)
      console.log('[api/policy-conditions] Endpoint:', API_ENDPOINTS.POLICY_CONDITIONS)
      const data = await getWithRefresh(
        request,
        API_ENDPOINTS.POLICY_CONDITIONS,
        Object.keys(params).length ? params : undefined
      )
      console.log('[api/policy-conditions] Success, returning data')
      return NextResponse.json(data)
    } catch (err: unknown) {
      const e = err as
        | { message?: string; status?: number; response?: { data?: unknown; status?: number } }
        | undefined

      console.error('[api/policy-conditions] ❌ Error from backend:', {
        message: e?.message,
        status: e?.status || e?.response?.status,
        responseData: e?.response?.data,
      })

      // Trả về chi tiết lỗi từ backend nếu có
      if (e?.response?.data && typeof e.response.data === 'object') {
        const backendError = e.response.data as {
          statusCode?: number
          message?: string
          error?: string
        }
        console.error('[api/policy-conditions] Backend error details:', backendError)

        return NextResponse.json(backendError, {
          status: backendError.statusCode || e?.response?.status || e?.status || 500,
        })
      }

      return NextResponse.json(
        {
          error: e?.message || 'Internal Server Error',
          statusCode: e?.status || e?.response?.status || 500,
        },
        { status: e?.status || e?.response?.status || 500 }
      )
    }
  } catch (error: unknown) {
    const err = error as
      | { message?: string; response?: { status?: number; data?: unknown } }
      | undefined

    console.error('API Route /api/policy-conditions GET error:', {
      error: error,
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
    })

    if (err?.response?.data) {
      console.error(
        '[api/policy-conditions] Backend error response:',
        JSON.stringify(err.response.data, null, 2)
      )
    }

    // Trả về chi tiết lỗi từ backend
    if (err?.response?.data) {
      return NextResponse.json(err.response.data, { status: err?.response?.status || 500 })
    }

    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}
