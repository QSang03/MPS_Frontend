import React from 'react'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'

type Props = React.ComponentProps<typeof SystemPageLayout>

export function UserPageLayout({ children, ...props }: Props) {
  return (
    <SystemPageLayout fullWidth {...(props as Props)}>
      {children}
    </SystemPageLayout>
  )
}

export default UserPageLayout
