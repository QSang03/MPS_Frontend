import { WarehouseDocumentDetailClient } from '../_components/WarehouseDocumentDetailClient'
import { getSession } from '@/lib/auth/session'
import { DEV_BYPASS_AUTH, getDevSession } from '@/lib/auth/dev-session'
import { ActionGuard } from '@/components/shared/ActionGuard'

interface Props {
  params?: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function WarehouseDocumentDetailPage({ params }: Props) {
  let session = await getSession()
  const resolved = await params
  const id = resolved?.id ?? ''

  if (!session && DEV_BYPASS_AUTH) session = getDevSession('sys-admin')

  return (
    <ActionGuard
      pageId="warehouse-documents"
      actionId="view-detail"
      fallback={
        <div className="text-muted-foreground py-8 text-center">
          Không có quyền xem chi tiết chứng từ kho
        </div>
      }
    >
      <WarehouseDocumentDetailClient id={id} session={session} />
    </ActionGuard>
  )
}
