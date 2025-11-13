import DevicesPageClient from './_components/DevicesPageClient'

export const metadata = {
  title: 'Thiết bị của tôi',
}

export default function DevicesPage() {
  return (
    <div className="p-4">
      <DevicesPageClient />
    </div>
  )
}
