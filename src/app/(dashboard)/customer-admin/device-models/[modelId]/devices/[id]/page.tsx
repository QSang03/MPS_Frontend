import { DeviceDetailClient } from './_components/DeviceDetailClient'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function DeviceDetailInModelPage({
  params,
}: {
  params: Promise<{ modelId: string; id: string }>
}) {
  const resolvedParams = await params
  const { id, modelId } = resolvedParams

  // Pass both deviceId and modelId for context
  return <DeviceDetailClient deviceId={id} modelId={modelId} />
}
