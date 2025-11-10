import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import {
  getSession,
  createSessionWithTokens,
  getAccessToken,
  getRefreshToken,
} from '@/lib/auth/session'

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { oldPassword, newPassword } = body

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Old password and new password are required' },
        { status: 400 }
      )
    }

    // Call backend API to change password (backend expects currentPassword, not oldPassword)
    const response = await backendApiClient.patch(
      '/auth/change-password',
      {
        currentPassword: oldPassword,
        newPassword,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    // After successful password change, update session to remove isDefaultPassword flag
    const session = await getSession()
    if (session && session.isDefaultPassword) {
      const updatedSession = { ...session, isDefaultPassword: false }
      const currentAccessToken = await getAccessToken()
      const currentRefreshToken = await getRefreshToken()

      if (currentAccessToken && currentRefreshToken) {
        await createSessionWithTokens({
          session: updatedSession,
          accessToken: currentAccessToken,
          refreshToken: currentRefreshToken,
        })
      }
    }

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as
      | {
          message?: string
          response?: {
            status?: number
            data?: unknown
          }
        }
      | undefined

    console.error('API Route /api/auth/change-password POST error:', error)

    // Return full error response from backend if available
    if (err?.response?.data) {
      return NextResponse.json(err.response.data, { status: err.response.status || 500 })
    }

    // Fallback to simple error message
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}
