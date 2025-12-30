'use client'

import ClientLeadDetail from './ClientLeadDetail'
import { useLocale } from '@/components/providers/LocaleProvider'

export default function LeadShowPage(props: unknown) {
  const { t } = useLocale()
  const id = (props as { params?: { id?: string } })?.params?.id
  if (!id) {
    return (
      <div className="p-6">
        <h1 className="mb-4 text-xl font-semibold">{t('leads.detail_title') || 'Lead details'}</h1>
        <div>{t('leads.not_found') || 'Lead not found'}</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-semibold">{t('leads.detail_title') || 'Lead details'}</h1>
      <ClientLeadDetail id={id} />
    </div>
  )
}
