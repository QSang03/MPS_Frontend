import DevicesForModelClient from './DevicesForModelClient'

interface PageProps {
  // Next.js App Router passes params as a Promise; await before using
  params: Promise<{ modelId: string }>
}

export default async function Page({ params }: PageProps) {
  const resolved = await params
  return <DevicesForModelClient modelIdParam={resolved.modelId} />
}
