'use client'

import { useSignedUrl } from '@/lib/hooks/useSignedUrl'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useState } from 'react'

interface SignedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  expiryHours?: number
  fallbackSrc?: string
  onError?: () => void
}

/**
 * Image component that uses signed URLs for secure file access
 * Automatically generates signed URLs for backend-served images
 */
export function SignedImage({
  src,
  alt,
  className,
  width,
  height,
  expiryHours = 24,
  fallbackSrc,
  onError,
}: SignedImageProps) {
  const [hasError, setHasError] = useState(false)

  // Generate signed URL for the image
  const { data: signedUrl, isLoading, error } = useSignedUrl(src, expiryHours, !hasError)

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  // Show loading state
  if (isLoading) {
    return (
      <div
        className={cn('animate-pulse rounded bg-gray-200', className)}
        style={{ width, height }}
        role="img"
        aria-label={`Loading ${alt}`}
      />
    )
  }

  // Show error state or fallback
  if (error || hasError) {
    if (fallbackSrc) {
      return (
        <Image
          src={fallbackSrc}
          alt={alt}
          className={className}
          width={width}
          height={height}
          onError={handleError}
        />
      )
    }

    return (
      <div
        className={cn(
          'flex items-center justify-center rounded border-2 border-dashed border-gray-300 bg-gray-100 text-sm text-gray-500',
          className
        )}
        style={{ width, height }}
        role="img"
        aria-label={`Failed to load ${alt}`}
      >
        Image unavailable
      </div>
    )
  }

  // Render the signed image
  if (signedUrl) {
    return (
      <Image
        src={signedUrl}
        alt={alt}
        className={className}
        width={width}
        height={height}
        onError={handleError}
      />
    )
  }

  // Fallback to direct URL if signed URL generation fails
  return (
    <Image
      src={`${process.env.NEXT_PUBLIC_API_URL}/public/uploads/${src}`}
      alt={alt}
      className={className}
      width={width}
      height={height}
      onError={handleError}
    />
  )
}
