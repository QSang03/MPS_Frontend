import WarehouseDocumentsPanel from './_components/WarehouseDocumentsPanel'
import { getSession } from '@/lib/auth/session'
import { DEV_BYPASS_AUTH, getDevSession } from '@/lib/auth/dev-session'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import WarehouseDocumentsHeaderClient from './WarehouseDocumentsHeaderClient'

export const dynamic = 'force-dynamic'

export default async function WarehouseDocumentsPage() {
  let session = await getSession()
  if (!session && DEV_BYPASS_AUTH) session = getDevSession('sys-admin')

  return (
    <SystemPageLayout fullWidth>
      <WarehouseDocumentsHeaderClient />

      <WarehouseDocumentsPanel />
    </SystemPageLayout>
  )
}
