import ClientLeadDetail from './ClientLeadDetail'

export default function LeadShowPage(props: unknown) {
  const id = (props as { params?: { id?: string } })?.params?.id
  if (!id) {
    return (
      <div className="p-6">
        <h1 className="mb-4 text-xl font-semibold">Chi tiết lead</h1>
        <div>Lead not found</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Chi tiết lead</h1>
      <ClientLeadDetail id={id} />
    </div>
  )
}
