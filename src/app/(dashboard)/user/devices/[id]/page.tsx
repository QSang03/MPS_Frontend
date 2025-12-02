import DeviceDetailClient from './_components/DeviceDetailClient'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { UserPageLayout } from '@/components/user/UserPageLayout'

interface Props {
  params?: Promise<{ id: string }>
}

export default async function DevicePage({ params }: Props) {
  const resolved = (await params) as { id?: string } | undefined
  const id = resolved?.id ?? ''

  return (
    <UserPageLayout>
      <QueryProvider>
        <DeviceDetailClient deviceId={id} backHref="/user/devices" />
      </QueryProvider>
    </UserPageLayout>
  )
}
