'use server'

import { getAccessToken, refreshAccessToken, updateTokensInCookies } from './session'
import { authService } from '@/lib/api/services/auth.service'
import { withRefreshRetry, AuthExpiredError } from '@/lib/api/server-retry'
import type { UserProfile } from '@/types/auth'

/**
 * Server action to get access token for client-side use
 * This file is separate to avoid mixing server and client code
 */
export async function getAccessTokenForClient(): Promise<string | null> {
  return await getAccessToken()
}

/**
 * Server action to refresh access token for client-side use
 */
export async function refreshAccessTokenForClient(): Promise<string | null> {
  return await refreshAccessToken()
}

/**
 * Server action to update tokens in cookies
 * Next.js 15 requires cookie modifications to be in Server Actions
 */
export async function updateTokensInCookiesAction(
  accessToken: string,
  refreshToken?: string
): Promise<void> {
  await updateTokensInCookies(accessToken, refreshToken)
}

/**
 * Server action to get user profile for client-side use
 */
export async function getUserProfileForClient(): Promise<UserProfile | null> {
  try {
    return await authService.getProfileServer()
  } catch (error) {
    console.error('Failed to get user profile:', error)
    return null
  }
}

/**
 * Server action to change password for client
 */
export async function changePasswordForClient(payload: {
  currentPassword: string
  newPassword: string
}) {
  try {
    const res = await withRefreshRetry(() => authService.changePasswordServer(payload))
    return res
  } catch (error) {
    // If refresh token is expired, return an explicit payload so client can redirect
    if (error instanceof AuthExpiredError) {
      return { authExpired: true }
    }

    const err = error as unknown
    const data = (err as { response?: { data?: unknown } })?.response?.data
    if (data) {
      return data
    }
    console.error('Failed to change password:', error)
    throw error
  }
}
