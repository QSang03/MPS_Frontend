import ServiceRequestMessages from './ServiceRequestMessages'

interface Props {
  serviceRequestId: string
  currentUserId?: string | null
}

/**
 * Server component wrapper for ServiceRequestMessages
 * Simply renders the client component with provided props
 */
export default function ServiceRequestMessagesServer({ serviceRequestId, currentUserId }: Props) {
  return (
    <ServiceRequestMessages
      serviceRequestId={serviceRequestId}
      currentUserId={currentUserId}
      pageId="user-my-requests"
    />
  )
}
