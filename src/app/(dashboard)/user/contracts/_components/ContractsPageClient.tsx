'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { contractsClientService } from '@/lib/api/services/contracts-client.service'
import type { Contract } from '@/types/models/contract'
import { Skeleton } from '@/components/ui/skeleton'

export default function ContractsPageClient() {
  const [contracts, setContracts] = useState<Contract[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        // backend will scope contracts by session customer when called from user session
        const res = await contractsClientService.getAll({ page: 1, limit: 100 })
        if (!mounted) return
        setContracts(res.data || [])
      } catch (err) {
        console.error('Failed to load user contracts', err)
        setContracts([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Hợp đồng của tôi</h1>
        <p className="text-muted-foreground">Danh sách hợp đồng liên quan đến khách hàng của bạn</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách hợp đồng</CardTitle>
        </CardHeader>
        <CardContent>
          {contracts && contracts.length > 0 ? (
            <ul className="space-y-2">
              {contracts.map((c) => (
                <li key={c.id} className="flex items-center justify-between border-b py-2">
                  <div>
                    <div className="font-medium">{c.code || c.id}</div>
                    <div className="text-muted-foreground text-sm">{c.name || c.type || ''}</div>
                  </div>
                  <div className="text-muted-foreground text-sm">{c.status || ''}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-muted-foreground text-sm">Chưa có hợp đồng nào</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
