import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

function getFilenameFromContentDisposition(value: string | null): string | undefined {
  if (!value) return undefined

  // RFC 5987: filename*=UTF-8''...
  const starMatch = value.match(/filename\*=(?:UTF-8'')?([^;]+)/i)
  if (starMatch?.[1]) {
    const raw = starMatch[1].trim().replace(/^"|"$/g, '')
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }

  const match = value.match(/filename=([^;]+)/i)
  if (!match?.[1]) return undefined
  return match[1].trim().replace(/^"|"$/g, '')
}

async function fetchTemplate(accessToken: string) {
  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINTS.COST_CALCULATION.TEMPLATE}`
  return fetch(backendUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized - No access token' }, { status: 401 })
    }

    let resp = await fetchTemplate(accessToken)

    if (resp.status === 401) {
      const refreshToken = cookieStore.get('refresh_token')?.value
      if (refreshToken) {
        try {
          const refreshResponse = await backendApiClient.post(
            API_ENDPOINTS.AUTH.REFRESH,
            {},
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`,
              },
            }
          )

          const newAccessToken = (refreshResponse.data as { data?: { access_token?: string } })
            ?.data?.access_token
          if (newAccessToken) {
            resp = await fetchTemplate(newAccessToken)

            const buf = await resp.arrayBuffer()
            const headers = new Headers(resp.headers)

            if (!headers.get('content-type')) {
              headers.set(
                'content-type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              )
            }
            const filename =
              getFilenameFromContentDisposition(headers.get('content-disposition')) ||
              'cost-calculation-template.xlsx'
            headers.set('content-disposition', `attachment; filename="${filename}"`)

            const response = new NextResponse(buf, { status: resp.status, headers })
            const IS_SECURE_COOKIES =
              process.env.NODE_ENV === 'production' && process.env.ALLOW_INSECURE_COOKIES !== 'true'
            response.cookies.set('access_token', newAccessToken, {
              httpOnly: true,
              secure: IS_SECURE_COOKIES,
              sameSite: 'lax',
              path: '/',
            })
            return response
          }
        } catch (refreshErr) {
          console.error('Token refresh failed:', refreshErr)
        }
      }

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const buf = await resp.arrayBuffer()
    const headers = new Headers(resp.headers)

    if (!headers.get('content-type')) {
      headers.set(
        'content-type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
    }

    const filename =
      getFilenameFromContentDisposition(headers.get('content-disposition')) ||
      'cost-calculation-template.xlsx'
    headers.set('content-disposition', `attachment; filename="${filename}"`)

    return new NextResponse(buf, { status: resp.status, headers })
  } catch (error: unknown) {
    console.error('[API] cost-calculation template GET error:', error)
    return NextResponse.json({ error: 'Failed to download template' }, { status: 500 })
  }
}
