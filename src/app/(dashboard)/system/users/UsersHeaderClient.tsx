'use client'

import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { Users } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import UsersHeaderActions from './UsersHeaderActions'

export default function UsersHeaderClient() {
  const { t } = useLocale()

  return (
    <SystemPageHeader
      title={t('page.users.title')}
      subtitle={t('page.users.subtitle')}
      icon={<Users className="h-6 w-6" />}
      actions={<UsersHeaderActions />}
    />
  )
}
