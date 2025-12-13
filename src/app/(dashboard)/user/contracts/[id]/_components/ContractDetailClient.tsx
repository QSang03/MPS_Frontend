'use client'

import { useEffect, useState } from 'react'
import type { Contract } from '@/types/models/contract'
import { useRouter } from 'next/navigation'
import { contractsClientService } from '@/lib/api/services/contracts-client.service'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/components/providers/LocaleProvider'
import { FileText } from 'lucide-react'
import ContractDevicesSection from '../../_components/ContractDevicesSection'
import { toast } from 'sonner'

interface Props {
  contractId: string
}

export default function ContractDetailClient({ contractId }: Props) {
  const router = useRouter()
  const { t } = useLocale()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  // edit / assign-device removed for user view

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
        toast.error(t('contracts.error.load'))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [contractId, t])

  if (loading) {
    return <div className="p-6">{t('loading.default')}</div>
  }

  if (!contract) {
    return <div className="p-6">{t('customer.detail.contract_not_found')}</div>
  }

  // initialForForm removed — edit/assign actions are not available in user view

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-sky-700">{t('contracts.devices.title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('contracts.devices.description')}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()} className="h-9">
            {t('common.back')}
          </Button>
          {contract.documentUrl && (
            <Button variant="secondary" size="sm" asChild className="gap-1">
              <a href={contract.documentUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4" />
                {t('contracts.view_document')}
              </a>
            </Button>
          )}
          {/* Edit and assign-device actions removed for user view */}
        </div>
      </div>

      <ContractDevicesSection contractId={contract.id} />
      {/* devices list (read-only) rendered above; user cannot assign or edit */}
    </div>
  )
}
