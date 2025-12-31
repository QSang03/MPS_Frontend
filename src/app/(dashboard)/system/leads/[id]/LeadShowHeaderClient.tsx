'use client'

import React from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'

export default function LeadShowHeaderClient({ id }: { id?: string }) {
  const { t } = useLocale()

  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">{t('leads.detail_title') || 'Lead details'}</h1>
      {!id ? <div>{t('leads.not_found') || 'Lead not found'}</div> : null}
    </>
  )
}
