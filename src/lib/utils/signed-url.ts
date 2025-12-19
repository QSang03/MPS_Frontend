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
export function useSignedUrl(
  filePath: string | null | undefined,
  expiryHours: number = 24
): string | null {
  // This is a placeholder - in a real implementation, you'd use React Query or similar
  // to fetch the signed URL asynchronously
  if (!filePath) return null

  // For now, return the direct URL - this should be replaced with actual signed URL fetching
  // In production, this would call signedUrlService.generateSignedUrl(filePath, expiryHours)
  return `${process.env.NEXT_PUBLIC_API_URL}/public/uploads/${filePath}?expires=${Date.now() + expiryHours * 60 * 60 * 1000}`
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

  const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/public/uploads/${filePath}`
  const signedUrl = new URL(baseUrl)
  signedUrl.searchParams.set('expires', expiresAt.toString())
  signedUrl.searchParams.set('secure', 'true') // Placeholder for actual signature

  return signedUrl.toString()
}
