import CustomerDetailClient from './_components/CustomerDetailClient'

export const metadata = {
  title: 'Customer details',
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="p-4">
      <CustomerDetailClient customerId={id} />
    </div>
  )
}
