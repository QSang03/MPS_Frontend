import { DeviceDetailClient } from '@/app/(dashboard)/customer-admin/device-models/[modelId]/devices/[id]/_components/DeviceDetailClient'

interface Props {
  // Align with Next's generated PageProps which may treat `params` as a Promise<any>.
  // Use Promise<{ id: string }> | undefined so this type is assignable to PageProps.params.
  params?: Promise<{ id: string }>
}

export default async function DevicePage({ params }: Props) {
  // `params` may be a Promise or undefined. Await it and coerce the result shape.
  const resolved = (await params) as { id?: string } | undefined
  const id = resolved?.id ?? ''
  // DeviceDetailClient is a client component that will fetch device details itself
  return <DeviceDetailClient deviceId={id} backHref="/customer-admin/devices" />
}
