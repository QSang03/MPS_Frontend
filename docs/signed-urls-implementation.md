# Signed URLs Implementation

This document describes the implementation of self-presigning for URLs served through the backend, enhancing security and control for file access.

## Overview

The signed URLs feature provides secure, time-limited access to files served by the backend. This prevents unauthorized access and allows for better control over file distribution.

The implementation automatically adapts to different deployment scenarios:

- **Public Backend**: Direct signed URLs pointing to the backend
- **Private Backend** (Docker/internal networks): Files proxied through Next.js API routes with signature validation

This ensures security regardless of whether the backend is publicly accessible or running in a private network.

## Environment Variables

Add the following to your `.env.local` file:

```bash
# File URL Signing
FILE_SIGNING_SECRET=your-super-secret-file-signing-key-change-this-in-production
FILE_URL_EXPIRY_HOURS=24
```

## Components

### SignedImage

A React component for displaying images with signed URLs.

```tsx
import { SignedImage } from '@/components/ui/signed-image'

function MyComponent() {
  return (
    <SignedImage
      src="images/device-123.jpg"
      alt="Device image"
      width={300}
      height={200}
      expiryHours={24}
      fallbackSrc="/placeholder.jpg"
    />
  )
}
```

**Props:**

- `src`: File path relative to uploads directory
- `alt`: Alt text for the image
- `width`/`height`: Image dimensions
- `expiryHours`: URL validity period (default: 24)
- `fallbackSrc`: Fallback image if signed URL fails
- `onError`: Error callback

### SignedFileLink

A React component for creating secure download links.

```tsx
import { SignedFileLink } from '@/components/ui/signed-file-link'

function MyComponent() {
  return (
    <SignedFileLink
      filePath="reports/monthly-report.pdf"
      fileName="Monthly Report.pdf"
      variant="button"
      expiryHours={24}
    >
      Download Report
    </SignedFileLink>
  )
}
```

**Props:**

- `filePath`: File path relative to uploads directory
- `fileName`: Display name for the file
- `variant`: 'link' or 'button' (default: 'link')
- `expiryHours`: URL validity period (default: 24)
- `showIcon`: Whether to show an icon (default: true)
- `icon`: Custom icon component

## Hooks

### useSignedUrl

React Query hook for fetching signed URLs.

```tsx
import { useSignedUrl } from '@/lib/hooks/useSignedUrl'

function MyComponent() {
  const { data: signedUrl, isLoading, error } = useSignedUrl('images/photo.jpg', 24)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading image</div>

  return <img src={signedUrl} alt="Photo" />
}
```

### useMultipleSignedUrls

Hook for fetching multiple signed URLs at once.

```tsx
import { useMultipleSignedUrls } from '@/lib/hooks/useSignedUrl'

function MyComponent() {
  const filePaths = ['file1.pdf', 'file2.pdf', 'file3.pdf']
  const { data: signedUrls, isLoading } = useMultipleSignedUrls(filePaths, 24)

  return (
    <div>
      {signedUrls?.map((url, index) => (
        <a key={index} href={url} target="_blank">
          Download File {index + 1}
        </a>
      ))}
    </div>
  )
}
```

## Service

### SignedUrlService

Service class for generating signed URLs programmatically.

```tsx
import { signedUrlService } from '@/lib/utils/signed-url'

// Generate single signed URL
const signedUrl = await signedUrlService.generateSignedUrl('reports/data.pdf', 24)

// Generate multiple signed URLs
const signedUrls = await signedUrlService.generateMultipleSignedUrls(['file1.pdf', 'file2.pdf'], 24)
```

## Backend API Endpoints

The implementation supports two modes depending on backend accessibility:

### Mode 1: Direct Backend Access (Public Backend)

When the backend is publicly accessible, the frontend calls:

#### POST /api/files/signed-url

Generates a signed URL pointing directly to the backend.

**Request Body:**

```json
{
  "filePath": "path/to/file.pdf",
  "expiryHours": 24
}
```

**Response:**

```json
{
  "signedUrl": "https://backend.example.com/public/uploads/path/to/file.pdf?expires=1234567890&signature=abc123..."
}
```

#### POST /api/files/signed-urls

Generates signed URLs for multiple files.

**Request Body:**

```json
{
  "filePaths": ["file1.pdf", "file2.pdf"],
  "expiryHours": 24
}
```

**Response:**

```json
{
  "signedUrls": ["https://backend.example.com/...", "https://backend.example.com/..."]
}
```

### Mode 2: Proxied Access (Private Backend)

When the backend is not publicly accessible (e.g., Docker internal network), files are proxied through Next.js API routes.

#### Next.js API Route: GET /api/files/proxy

Proxies file requests with signature validation.

**Query Parameters:**

- `file`: File path relative to uploads directory
- `expires`: Unix timestamp when URL expires
- `signature`: HMAC signature for validation

**Example URL:**

```
/api/files/proxy?file=path/to/file.pdf&expires=1234567890&signature=abc123
```

**Automatic Fallback:**
The `SignedUrlService` automatically falls back to proxied URLs if direct backend calls fail, making the implementation work in both scenarios without configuration changes.

## Security Considerations

1. **Secret Key**: Keep `FILE_SIGNING_SECRET` secure and rotate regularly
2. **Expiry Time**: Balance usability with security - shorter expiry for sensitive files
3. **HTTPS Only**: Always serve signed URLs over HTTPS
4. **Rate Limiting**: Implement rate limiting on signed URL generation endpoints
5. **Audit Logging**: Log signed URL generation for security monitoring

## Migration Guide

To migrate existing file URLs to signed URLs:

1. Replace direct image tags:

   ```tsx
   // Before
   <img src={`${API_URL}/public/uploads/${filePath}`} />

   // After
   <SignedImage src={filePath} alt="..." />
   ```

2. Replace direct download links:

   ```tsx
   // Before
   <a href={`${API_URL}/public/uploads/${filePath}`}>Download</a>

   // After
   <SignedFileLink filePath={filePath}>Download</SignedFileLink>
   ```

3. Update any programmatic file access to use the service or hooks.

## Error Handling

The components handle various error states:

- Loading states with spinners
- Network errors with fallback UI
- Invalid file paths
- Backend unavailability

Always provide fallback content for critical file displays.
