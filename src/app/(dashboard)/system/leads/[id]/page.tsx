import React from 'react'
import ClientLeadDetail from './ClientLeadDetail'
import LeadShowHeaderClient from './LeadShowHeaderClient'

type Params = { id?: string }

function isPromise<T>(v: T | Promise<T>): v is Promise<T> {
  return typeof (v as unknown as { then?: unknown }).then === 'function'
}

export default function LeadShowPage(props: { params?: Promise<Params> }) {
  const rawParams = props.params as unknown
  const params =
    rawParams && isPromise(rawParams)
      ? React.use(rawParams as Promise<Params>)
      : (rawParams as Params | undefined)
  const id = params?.id
  return (
    <div className="p-6">
      <LeadShowHeaderClient id={id} />
      {id ? <ClientLeadDetail id={id} /> : null}
    </div>
  )
}
