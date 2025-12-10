import { Card, CardContent } from '@/components/ui/card'
import { getSession } from '@/lib/auth/session'
import { DEV_BYPASS_AUTH, getDevSession } from '@/lib/auth/dev-session'
import WarehouseDocumentForm from '.././_components/WarehouseDocumentForm'
import NewWarehouseDocumentHeaderClient from '../NewWarehouseDocumentHeaderClient'
import NewWarehouseDocumentFormHeaderClient from '../NewWarehouseDocumentFormHeaderClient'

export const dynamic = 'force-dynamic'

export default async function NewWarehouseDocumentPage() {
  let session = await getSession()
  if (!session && DEV_BYPASS_AUTH) session = getDevSession('sys-admin')

  return (
    <div className="space-y-6">
      <NewWarehouseDocumentHeaderClient />
      <Card>
        <NewWarehouseDocumentFormHeaderClient />
        <CardContent>
          <WarehouseDocumentForm />
        </CardContent>
      </Card>
    </div>
  )
}
