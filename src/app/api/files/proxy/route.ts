import { NextRequest, NextResponse } from 'next/server'
import { validateSignedUrl } from '@/lib/utils/signed-url'

/**
 * API Route for proxying file access with signed URL validation
 * Used when backend is not publicly accessible (e.g., Docker internal network)
 *
 * Query parameters:
 * - file: The file path relative to uploads directory
 * - expires: Unix timestamp when URL expires
 * - signature: HMAC signature for validation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('file')
    const expires = searchParams.get('expires')
    const signature = searchParams.get('signature')

    // Validate required parameters
    if (!filePath || !expires || !signature) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Validate signature and expiry
    const currentUrl = new URL(request.url)
    currentUrl.pathname = `/api/files/proxy`
    currentUrl.searchParams.set('file', filePath)
    currentUrl.searchParams.set('expires', expires)
    currentUrl.searchParams.set('signature', signature)

    if (!validateSignedUrl(currentUrl)) {
      return NextResponse.json({ error: 'Invalid or expired signed URL' }, { status: 403 })
    }

    // Construct backend URL
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/public/uploads/${filePath}`

    // Fetch file from backend
    const response = await fetch(backendUrl, {
      headers: {
        // Forward authorization if present
        ...(request.headers.get('authorization') && {
          Authorization: request.headers.get('authorization')!,
        }),
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'File not found or access denied' },
        { status: response.status }
      )
    }

    // Get file content
    const fileBuffer = await response.arrayBuffer()

    // Return file with appropriate headers
    const headers = new Headers()

    // Copy content-type from backend response
    const contentType = response.headers.get('content-type')
    if (contentType) {
      headers.set('Content-Type', contentType)
    }

    // Set cache control for signed URLs (short cache since they expire)
    headers.set('Cache-Control', 'private, max-age=3600') // 1 hour cache

    // Set content disposition for downloads
    const fileName = filePath.split('/').pop()
    if (fileName) {
      headers.set('Content-Disposition', `inline; filename="${fileName}"`)
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('File proxy error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
