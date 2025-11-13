import ContractsPageClient from './_components/ContractsPageClient'

export const metadata = {
  title: 'Hợp đồng của tôi',
}

export default function ContractsPage() {
  return (
    <div className="p-4">
      <ContractsPageClient />
    </div>
  )
}
