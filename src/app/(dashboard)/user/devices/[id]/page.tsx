import DeviceDetailClient from './_components/DeviceDetailClient'

interface Props {
  params?: Promise<{ id: string }>
}

export default async function DevicePage({ params }: Props) {
  const resolved = (await params) as { id?: string } | undefined
  const id = resolved?.id ?? ''
  return <DeviceDetailClient deviceId={id} backHref="/user/devices" />
}
