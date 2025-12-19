import { useQuery } from '@tanstack/react-query'
import { signedUrlService } from '../utils/signed-url'

/**
 * React hook for generating signed URLs with React Query caching
 * @param filePath - The file path relative to uploads directory
 * @param expiryHours - Number of hours until URL expires (default: 24)
 * @param enabled - Whether to enable the query (default: true if filePath exists)
 * @returns Query result with signed URL data
 */
export function useSignedUrl(
  filePath: string | null | undefined,
  expiryHours: number = 24,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['signed-url', filePath, expiryHours],
    queryFn: () => {
      if (!filePath) throw new Error('File path is required')
      return signedUrlService.generateSignedUrl(filePath, expiryHours)
    },
    enabled: enabled && Boolean(filePath),
    staleTime: 1000 * 60 * 30, // 30 minutes - URLs are valid for longer
    gcTime: 1000 * 60 * 60, // 1 hour cache
  })
}

/**
 * Hook for generating multiple signed URLs
 * @param filePaths - Array of file paths
 * @param expiryHours - Number of hours until URLs expire (default: 24)
 * @param enabled - Whether to enable the query
 * @returns Query result with array of signed URLs
 */
export function useMultipleSignedUrls(
  filePaths: string[],
  expiryHours: number = 24,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['signed-urls', filePaths.sort(), expiryHours],
    queryFn: () => signedUrlService.generateMultipleSignedUrls(filePaths, expiryHours),
    enabled: enabled && filePaths.length > 0,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour cache
  })
}
