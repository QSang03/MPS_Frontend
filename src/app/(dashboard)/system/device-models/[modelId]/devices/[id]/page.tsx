import { redirect } from 'next/navigation'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function DeviceDetailInModelPage({
  params,
}: {
  params: Promise<{ modelId: string; id: string }>
}) {
  const resolvedParams = await params
  const { id } = resolvedParams

  // Redirect to centralized device page to avoid duplicated model-scoped device page
  redirect(`/system/devices/${id}`)
}
