'use client'

import React from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'

export default function Translated({ k }: { k: string }) {
  const { t } = useLocale()
  return <>{t(k)}</>
}
