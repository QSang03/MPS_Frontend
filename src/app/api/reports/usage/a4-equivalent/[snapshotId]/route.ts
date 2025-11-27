import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ snapshotId: string }> }
) {
  try {
    const { snapshotId } = (await params) as { snapshotId: string }
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const response = await backendApiClient.delete(`/reports/usage/a4-equivalent/${snapshotId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { status?: number; data?: unknown } }
    console.error('[api/reports/usage/a4-equivalent/:snapshotId] DELETE error:', err)

    if (err?.response?.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (err?.response?.status === 403) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        return NextResponse.json(data as unknown as Record<string, unknown>, { status: 403 })
      }
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (err?.response?.status === 404) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        return NextResponse.json(data as unknown as Record<string, unknown>, { status: 404 })
      }
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })
    }

    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 })
  }
}
