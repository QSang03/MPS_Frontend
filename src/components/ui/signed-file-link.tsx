'use client'

import { useSignedUrl } from '@/lib/hooks/useSignedUrl'
import { buildProxiedSignedUrl } from '@/lib/utils/signed-url'
import { cn } from '@/lib/utils'
import { Download, ExternalLink, FileText, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface SignedFileLinkProps {
  filePath: string
  fileName?: string
  className?: string
  variant?: 'link' | 'button'
  expiryHours?: number
  children?: React.ReactNode
  showIcon?: boolean
  icon?: React.ComponentType<{ className?: string }>
}

/**
 * File link component that uses signed URLs for secure file access
 * Automatically generates signed URLs for backend-served files like PDFs
 */
export function SignedFileLink({
  filePath,
  fileName,
  className,
  variant = 'link',
  expiryHours = 24,
  children,
  showIcon = true,
  icon: Icon = FileText,
}: SignedFileLinkProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  // Generate signed URL for the file
  const { data: signedUrl, isLoading, error } = useSignedUrl(filePath, expiryHours)

  const displayName = fileName || filePath.split('/').pop() || 'Download file'

  const handleDownload = async () => {
    if (!signedUrl) return

    setIsDownloading(true)
    try {
      // Create a temporary link and trigger download
      const link = document.createElement('a')
      link.href = signedUrl
      link.download = displayName
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn('text-muted-foreground flex items-center gap-2', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className={cn('flex items-center gap-2 text-red-500', className)}>
        <FileText className="h-4 w-4" />
        <span>Unable to access file</span>
      </div>
    )
  }

  // Render as button
  if (variant === 'button') {
    return (
      <button
        onClick={handleDownload}
        disabled={isDownloading || !signedUrl}
        className={cn(
          'inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      >
        {isDownloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : showIcon ? (
          <Download className="h-4 w-4" />
        ) : null}
        {children || displayName}
      </button>
    )
  }

  // Render as link
  if (signedUrl) {
    return (
      <Link
        href={signedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline',
          className
        )}
      >
        {showIcon && <Icon className="h-4 w-4" />}
        {children || displayName}
      </Link>
    )
  }

  // Fallback to direct URL if signed URL generation fails
  const fallbackUrl = buildProxiedSignedUrl(filePath, expiryHours)
  return (
    <Link
      href={fallbackUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline',
        className
      )}
    >
      {showIcon && <ExternalLink className="h-4 w-4" />}
      {children || displayName}
    </Link>
  )
}
