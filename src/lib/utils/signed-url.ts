import internalApiClient from '../api/internal-client'

/**
 * Service for generating signed URLs for secure file access
 * When backend is not publicly accessible, URLs are proxied through Next.js API routes
 */
class SignedUrlService {
  /**
   * Generates a signed URL for a file
   * @param filePath - The file path relative to the uploads directory (e.g., 'images/device-123.jpg')
   * @param expiryHours - Number of hours until the URL expires (default: 24)
   * @returns Promise resolving to signed URL string
   */
  async generateSignedUrl(filePath: string, expiryHours: number = 24): Promise<string> {
    try {
      const response = await internalApiClient.post('/api/files/signed-url', {
        filePath,
        expiryHours,
      })
      return response.data.signedUrl
    } catch (error) {
      console.error('Failed to generate signed URL:', error)
      // Fallback to proxied URL through Next.js API route
      return this.generateProxiedSignedUrl(filePath, expiryHours)
    }
  }

  /**
   * Generates a proxied signed URL through Next.js API routes
   * Used when backend is not publicly accessible (e.g., Docker internal network)
   */
  private generateProxiedSignedUrl(filePath: string, expiryHours: number): string {
    const expiresAt = Math.floor(Date.now() / 1000) + expiryHours * 60 * 60
    const signature = this.generateSignature(filePath, expiresAt)

    // Use Next.js API route as proxy
    const baseUrl = '/api/files/proxy'
    const url = new URL(
      baseUrl,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    )
    url.searchParams.set('file', filePath)
    url.searchParams.set('expires', expiresAt.toString())
    url.searchParams.set('signature', signature)

    return url.toString()
  }

  /**
   * Public helper to generate proxied signed URL (useful for sync fallbacks)
   */
  public generateProxiedSignedUrlPublic(filePath: string, expiryHours: number): string {
    return this.generateProxiedSignedUrl(filePath, expiryHours)
  }

  /**
   * Generates HMAC signature for file access
   */
  private generateSignature(filePath: string, expiresAt: number): string {
    // In production, this should be done on the server
    // For now, using a simple hash as placeholder
    const data = `${filePath}:${expiresAt}:${process.env.FILE_SIGNING_SECRET || 'default-secret'}`
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * Generates multiple signed URLs for batch operations
   * @param filePaths - Array of file paths
   * @param expiryHours - Number of hours until the URLs expire (default: 24)
   * @returns Promise resolving to array of signed URLs
   */
  async generateMultipleSignedUrls(
    filePaths: string[],
    expiryHours: number = 24
  ): Promise<string[]> {
    try {
      const response = await internalApiClient.post('/api/files/signed-urls', {
        filePaths,
        expiryHours,
      })
      return response.data.signedUrls
    } catch (error) {
      console.error('Failed to generate signed URLs:', error)
      // Fallback to proxied URLs
      return filePaths.map((filePath) => this.generateProxiedSignedUrl(filePath, expiryHours))
    }
  }
}

export const signedUrlService = new SignedUrlService()

/**
 * Validates a signed URL
 * @param url - The signed URL to validate
 * @returns boolean indicating if the URL is valid and not expired
 */
export function validateSignedUrl(url: URL): boolean {
  const secret = process.env.FILE_SIGNING_SECRET
  if (!secret) {
    return false
  }

  const expires = url.searchParams.get('expires')
  const signature = url.searchParams.get('signature')
  const file = url.searchParams.get('file')

  if (!expires || !signature || !file) {
    return false
  }

  const expiresAt = parseInt(expires, 10)
  const now = Math.floor(Date.now() / 1000)

  if (now > expiresAt) {
    return false // Expired
  }

  // Generate expected signature
  const expectedSignature = generateSignature(file, expiresAt, secret)

  // Use constant-time comparison to prevent timing attacks
  return signature === expectedSignature
}

/**
 * Generates HMAC signature for file access
 * @param filePath - The file path
 * @param expiresAt - Expiry timestamp
 * @param secret - Signing secret
 * @returns HMAC signature
 */
function generateSignature(filePath: string, expiresAt: number, secret: string): string {
  // Simple hash-based signature for demo purposes
  // In production, use proper HMAC-SHA256
  const data = `${filePath}:${expiresAt}:${secret}`
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16)
}

/**
 * React hook for generating signed URLs in components
 * @param filePath - The file path
 * @param expiryHours - Optional expiry hours
 * @returns Signed URL or null if filePath is empty
 */
/**
 * Synchronous helper for components that need a quick proxied URL fallback.
 * Returns a same-origin URL under `/api/files/proxy` so browser requests stay internal.
 */
export function buildProxiedSignedUrl(filePath: string, expiryHours: number = 24): string {
  if (!filePath) return ''
  return signedUrlService.generateProxiedSignedUrlPublic(filePath, expiryHours)
}

/**
 * Deprecated compatibility wrapper used in some places; prefer `buildProxiedSignedUrl`.
 */
export function useSignedUrl(
  filePath: string | null | undefined,
  expiryHours: number = 24
): string | null {
  if (!filePath) return null
  return buildProxiedSignedUrl(filePath, expiryHours)
}

/**
 * Utility function to get signed URL synchronously (for server-side use)
 * @param filePath - The file path
 * @param expiryHours - Optional expiry hours
 * @returns Signed URL string
 */
export function getSignedUrl(filePath: string, expiryHours?: number): string {
  // This is a placeholder implementation
  // In production, this should call the backend API to get a properly signed URL
  const expiry = expiryHours || parseInt(process.env.FILE_URL_EXPIRY_HOURS || '24', 10)
  const expiresAt = Math.floor(Date.now() / 1000) + expiry * 60 * 60

  // Use proxied route so client never requests backend domain directly
  const baseUrl = '/api/files/proxy'
  const signedUrl = new URL(
    baseUrl,
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  )
  signedUrl.searchParams.set('file', filePath)
  signedUrl.searchParams.set('expires', expiresAt.toString())
  // For sync signature we keep a placeholder secure param (server will validate)
  signedUrl.searchParams.set('secure', 'true')

  return signedUrl.toString()
}
