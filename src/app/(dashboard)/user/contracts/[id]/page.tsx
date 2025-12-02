import ContractDetailClient from './_components/ContractDetailClient'
import { UserPageLayout } from '@/components/user/UserPageLayout'

interface Props {
  // Next's generated PageProps may treat `params` as a Promise during type-checking.
  // Accept a Promise<{ id: string }> or undefined so the type is compatible.
  params?: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function Page({ params }: Props) {
  const resolved = (await params) as { id?: string } | undefined
  const id = resolved?.id ?? ''
  return (
    <UserPageLayout>
      <ContractDetailClient contractId={id} />
    </UserPageLayout>
  )
}
