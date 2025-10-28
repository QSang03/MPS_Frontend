import React from 'react'
import DeviceModelList from './_components/DeviceModelList'

export default function Page() {
  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Device Models</h1>
      <DeviceModelList />
    </div>
  )
}
