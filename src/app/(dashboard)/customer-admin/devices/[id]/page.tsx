import { DeviceDetailClient } from '@/app/(dashboard)/customer-admin/device-models/[modelId]/devices/[id]/_components/DeviceDetailClient'

interface Props {
  params: {
    id: string
  }
}

export default function DevicePage({ params }: Props) {
  const { id } = params
  // DeviceDetailClient is a client component that will fetch device details itself
  return <DeviceDetailClient deviceId={id} backHref="/customer-admin/devices" />
}
