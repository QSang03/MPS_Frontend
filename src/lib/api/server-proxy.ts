import backendApiClient from './backend-client'
import { cookies } from 'next/headers'

export async function getWithRefresh(
  request: Request,
  endpoint: string,
  params?: Record<string, string | number | boolean>
) {
  const cookieStore = await cookies()
  let accessToken = cookieStore.get('access_token')?.value
  // Allow Authorization header as a fallback
  if (!accessToken) {
    // Request should have headers.get available on the standard Request interface
    const authHeader =
      request.headers?.get('authorization') || request.headers?.get('Authorization')
    if (authHeader && String(authHeader).toLowerCase().startsWith('bearer ')) {
      accessToken = String(authHeader).slice(7).trim()
    }
  }

  if (!accessToken) {
    const e = new Error('Unauthorized') as Error & { status?: number }
    e.status = 401
    throw e
  }

  try {
    const resp = await backendApiClient.get(endpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: params && Object.keys(params).length ? params : undefined,
    })
    return resp.data
  } catch (err: unknown) {
    const errObj = err as { response?: { status?: number; data?: unknown }; message?: string }
    const status = errObj?.response?.status
    if (status === 401) {
      // attempt refresh
      try {
        const refreshToken = cookieStore.get('refresh_token')?.value
        if (!refreshToken) {
          const e = new Error('Unauthorized') as Error & { status?: number }
          e.status = 401
          throw e
        }

        const refreshResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })

        if (refreshResp.status !== 200) {
          cookieStore.delete('access_token')
          cookieStore.delete('refresh_token')
          cookieStore.delete('mps_session')
          const e = new Error('Unauthorized') as Error & { status?: number }
          e.status = 401
          throw e
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
          const e = new Error('Unauthorized') as Error & { status?: number }
          e.status = 401
          throw e
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

        const retryResp = await backendApiClient.get(endpoint, {
          headers: { Authorization: `Bearer ${newAccessToken}` },
          params: params && Object.keys(params).length ? params : undefined,
        })
        return retryResp.data
      } catch {
        const e = new Error('Unauthorized') as Error & { status?: number }
        e.status = 401
        throw e
      }
    }

    // other errors: rethrow with status and data if available
    const responseData = errObj?.response?.data
    const e = new Error(errObj?.message || 'Backend error') as Error & {
      status?: number
      response?: { data?: unknown; status?: number }
    }
    e.status = status || 500
    e.response = {
      status: status || 500,
      data: responseData,
    }
    throw e
  }
}
