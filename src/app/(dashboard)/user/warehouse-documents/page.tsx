import WarehouseDocumentsPageClient from './_components/WarehouseDocumentsPageClient'

export const metadata = {
  title: 'Chứng từ kho của tôi',
}

export default function WarehouseDocumentsPage() {
  return (
    <div className="p-4">
      <WarehouseDocumentsPageClient />
    </div>
  )
}
