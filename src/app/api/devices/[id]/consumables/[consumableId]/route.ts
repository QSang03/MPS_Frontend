import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { removeEmpty } from '@/lib/utils/clean'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; consumableId: string }> }
) {
  let reqBody: unknown = undefined
  let deviceId: string | undefined = undefined
  let consumableId: string | undefined = undefined
  try {
    const paramsObj = await params
    deviceId = paramsObj.id
    consumableId = paramsObj.consumableId

    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    reqBody = await request.json()
    const cleaned = removeEmpty(reqBody as Record<string, unknown>)

    const response = await backendApiClient.patch(
      `/devices/${deviceId}/consumables/${consumableId}`,
      cleaned,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as
      | {
          message?: string
          response?: { status?: number; data?: unknown }
          config?: { data?: unknown }
        }
      | undefined

    console.error(
      'API Route /api/devices/[id]/consumables/[consumableId] PATCH error:',
      err?.response?.status || err?.message
    )

    if (err?.response?.status === 401) {
      try {
        const cookieStore = await cookies()
        const refreshToken = cookieStore.get('refresh_token')?.value
        if (!refreshToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const refreshResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })

        if (refreshResp.status !== 200) {
          cookieStore.delete('access_token')
          cookieStore.delete('refresh_token')
          cookieStore.delete('mps_session')
          return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 })
        }

        const payload = await refreshResp.json()
        const newAccessToken =
          payload?.data?.accessToken || payload?.accessToken || payload?.access_token
        const newRefreshToken =
          payload?.data?.refreshToken || payload?.refreshToken || payload?.refresh_token

        if (!newAccessToken) {
          cookieStore.delete('access_token')
          cookieStore.delete('refresh_token')
          cookieStore.delete('mps_session')
          return NextResponse.json({ error: 'No access token in response' }, { status: 401 })
        }

        const isProduction = process.env.NODE_ENV === 'production'
        cookieStore.set('access_token', newAccessToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'lax',
          maxAge: 60 * 15,
          path: '/',
        })
        if (newRefreshToken)
          cookieStore.set('refresh_token', newRefreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
          })

        const originalBody =
          typeof reqBody !== 'undefined'
            ? reqBody
            : err?.config?.data && typeof err.config.data === 'string'
              ? JSON.parse(String(err.config.data))
              : {}
        const cleanedOriginal = removeEmpty(originalBody as Record<string, unknown>)

        const retryResp = await backendApiClient.patch(
          `/devices/${deviceId}/consumables/${consumableId}`,
          cleanedOriginal,
          { headers: { Authorization: `Bearer ${newAccessToken}` } }
        )
        return NextResponse.json(retryResp.data)
      } catch (retryErr: unknown) {
        const rerr = retryErr as { message?: string; response?: { status?: number } } | undefined
        console.error('Retry after refresh failed:', rerr?.message)
        return NextResponse.json(
          { error: rerr?.message || 'Internal Server Error' },
          { status: rerr?.response?.status || 500 }
        )
      }
    }

    // If backend returned structured body, forward it
    if (err?.response?.data && typeof err.response.data === 'object') {
      return NextResponse.json(err.response.data as unknown as Record<string, unknown>, {
        status: err.response?.status || 500,
      })
    }

    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}
