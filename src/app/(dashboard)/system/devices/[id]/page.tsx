import { DeviceDetailClient } from '@/app/(dashboard)/system/device-models/[modelId]/devices/[id]/_components/DeviceDetailClient'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { NoPermissionMessage } from './_components/NoPermissionMessage'

interface Props {
  // Align with Next's generated PageProps which may treat `params` as a Promise<any>.
  // Use Promise<{ id: string }> | undefined so this type is assignable to PageProps.params.
  params?: Promise<{ id: string }>
}

export default async function DevicePage({ params }: Props) {
  // `params` may be a Promise or undefined. Await it and coerce the result shape.
  const resolved = (await params) as { id?: string } | undefined
  const id = resolved?.id ?? ''

  // Try to fetch the device server-side to obtain its model id so child
  // client component receives `modelId`. This restores model-scoped
  // behaviors (e.g. showing "add compatible consumable") when rendered
  // from the global /system/devices/[id] route.
  let modelId: string | undefined = undefined
  try {
    const device = await devicesClientService.getById(id)
    // Narrow `device` as an object and access properties safely without `any`.
    if (device && typeof device === 'object') {
      const d = device as unknown as Record<string, unknown>
      const dm = d['deviceModel']
      if (dm && typeof dm === 'object') {
        const dmObj = dm as Record<string, unknown>
        if (dmObj['id']) modelId = String(dmObj['id'])
      }
      if (!modelId && d['deviceModelId']) modelId = String(d['deviceModelId'])
    }
  } catch {
    // ignore — component will still fetch device client-side if needed
    modelId = undefined
  }

  // Determine showA4 server-side based on device model flag if possible, otherwise default to 'auto'
  let showA4: boolean | 'auto' = 'auto'
  try {
    const device = await devicesClientService.getById(id)
    const raw = device?.deviceModel?.useA4Counter
    if (typeof raw === 'boolean') {
      showA4 = raw
    } else if (typeof raw === 'string') {
      showA4 = raw === 'true' || raw === '1'
    }
  } catch {
    // ignore; fallback to auto
  }

  return (
    <QueryProvider>
      <ActionGuard
        pageId="devices"
        actionId="view-device-detail"
        fallback={<NoPermissionMessage />}
      >
        <DeviceDetailClient
          deviceId={id}
          modelId={modelId}
          backHref="/system/devices"
          showA4={showA4}
        />
      </ActionGuard>
    </QueryProvider>
  )
}
