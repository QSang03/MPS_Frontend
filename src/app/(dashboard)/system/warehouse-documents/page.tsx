import WarehouseDocumentsPanel from './_components/WarehouseDocumentsPanel'
import { getSession } from '@/lib/auth/session'
import { DEV_BYPASS_AUTH, getDevSession } from '@/lib/auth/dev-session'
import { Box } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'

export const dynamic = 'force-dynamic'

export default async function WarehouseDocumentsPage() {
  let session = await getSession()
  if (!session && DEV_BYPASS_AUTH) session = getDevSession('sys-admin')

  return (
    <SystemPageLayout>
      <SystemPageHeader
        title="Chứng từ kho"
        subtitle="Danh sách các chứng từ nhập/xuất/trả"
        icon={<Box className="h-5 w-5" />}
        actions={
          <div className="flex gap-2">
            <Link href="/system/warehouse-documents/new">
              <Button variant="default">Tạo chứng từ mới</Button>
            </Link>
          </div>
        }
      />

      <WarehouseDocumentsPanel />
    </SystemPageLayout>
  )
}
