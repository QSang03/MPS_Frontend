'use client'

import { Suspense, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DeviceList } from './DeviceList'
import { DeviceFormModal } from './DeviceFormModal'
import { SearchInput } from './SearchInput'
import type { Session } from '@/types/auth'

interface DevicesPageClientProps {
  session: Session
  customerId: string
  fallback: React.ReactNode
}

export function DevicesPageClient({ session, customerId, fallback }: DevicesPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Thiết bị in</h1>
          <p className="text-muted-foreground">Quản lý tất cả thiết bị in ấn</p>
        </div>
        <DeviceFormModal customerId={customerId} />
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <SearchInput
          placeholder="Tìm theo serial, model, vị trí..."
          onSearch={handleSearch}
          className="max-w-md flex-1"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách thiết bị</CardTitle>
          <CardDescription>Xem và quản lý tất cả thiết bị của {session.username}</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={fallback}>
            <DeviceList customerId={customerId} searchQuery={searchQuery} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
