import ConsumablesPageClient from './_components/ConsumablesPageClient'

export const metadata = {
  title: 'Vật tư tiêu hao của tôi',
}

export default function ConsumablesPage() {
  return (
    <div className="p-4">
      <ConsumablesPageClient />
    </div>
  )
}
