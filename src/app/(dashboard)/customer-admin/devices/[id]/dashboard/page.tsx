import React from 'react'

export default function DeviceDashboardPage(props: unknown) {
  const params = (props as { params?: { id?: string } })?.params
  const id = params?.id ?? ''
  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold">Device {String(id)} dashboard</h1>
      <p className="text-muted-foreground text-sm">Tạm thời - nội dung trang đang được xây dựng.</p>
    </div>
  )
}
