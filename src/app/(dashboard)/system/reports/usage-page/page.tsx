import { Upload } from 'lucide-react'
import { getSession } from '@/lib/auth/session'
import { DEV_BYPASS_AUTH, getDevSession } from '@/lib/auth/dev-session'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import UsagePageUploader from './_components/UsagePageUploader'

export const dynamic = 'force-dynamic'

export default async function UsagePageReport() {
  let session = await getSession()
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title="Usage Page OCR"
        subtitle="Upload counter image, đối chiếu và lưu số liệu"
        icon={<Upload className="h-6 w-6" />}
      />
      <UsagePageUploader />
    </SystemPageLayout>
  )
}
