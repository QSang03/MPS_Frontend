'use client'

import { useEffect, useState } from 'react'
import type { Contract } from '@/types/models/contract'
import { useRouter } from 'next/navigation'
import { contractsClientService } from '@/lib/api/services/contracts-client.service'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ContractForm } from '../../_components/ContractForm'
import ContractDevicesModal from '../../_components/ContractDevicesModal'
import { Package, Edit } from 'lucide-react'
import ContractDevicesSection from '../../_components/ContractDevicesSection'
import { toast } from 'sonner'

interface Props {
  contractId: string
}

export default function ContractDetailClient({ contractId }: Props) {
  const router = useRouter()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDevicesOpen, setIsDevicesOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const c = await contractsClientService.getById(contractId)
        if (!mounted) return
        setContract(c || null)
      } catch (err) {
        console.error('Failed to load contract', err)
        toast.error('Không thể tải hợp đồng')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [contractId])

  if (loading) {
    return <div className="p-6">Đang tải...</div>
  }

  if (!contract) {
    return <div className="p-6">Không tìm thấy hợp đồng</div>
  }

  const initialForForm = {
    id: contract.id,
    customerId: contract.customerId,
    contractNumber: contract.contractNumber,
    type: contract.type,
    status: contract.status,
    startDate: contract.startDate,
    endDate: contract.endDate,
    description: contract.description ?? undefined,
    documentUrl: contract.documentUrl ?? undefined,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-sky-700">Thiết bị trong hợp đồng</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Các thiết bị đang gắn với hợp đồng này
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()} className="h-9">
            Quay lại
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setIsDevicesOpen(true)}>
            <Package className="h-4 w-4" /> Gán thiết bị
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(true)}>
            <Edit className="h-4 w-4" /> Chỉnh sửa
          </Button>
        </div>
      </div>

      <ContractDevicesSection
        contractId={contract.id}
        onRequestOpenAttach={() => setIsDevicesOpen(true)}
      />

      {/* Edit dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        {isEditOpen && (
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
            <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 p-0">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10 px-6 py-5 text-white">
                <DialogTitle className="text-2xl font-bold">✏️ Chỉnh sửa hợp đồng</DialogTitle>
              </div>
            </DialogHeader>

            <div className="max-h-[calc(90vh-120px)] overflow-y-auto bg-white">
              <div className="p-6">
                <ContractForm
                  initial={initialForForm}
                  onSuccess={(updated) => {
                    if (updated && updated.id) setContract(updated)
                    setIsEditOpen(false)
                    toast.success('Cập nhật hợp đồng thành công')
                  }}
                />
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Devices modal */}
      <ContractDevicesModal
        open={isDevicesOpen}
        onOpenChange={(v) => setIsDevicesOpen(v)}
        contractId={contract.id}
        contractNumber={contract.contractNumber}
      />
    </div>
  )
}
