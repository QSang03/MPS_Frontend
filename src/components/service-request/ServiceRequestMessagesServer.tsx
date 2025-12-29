import ServiceRequestMessages from './ServiceRequestMessages'

interface Props {
  serviceRequestId: string
  currentUserId?: string | null
  currentUserName?: string | null
}

/**
 * Server component wrapper for ServiceRequestMessages
 * Simply renders the client component with provided props
 */
export default function ServiceRequestMessagesServer({
  serviceRequestId,
  currentUserId,
  currentUserName,
}: Props) {
  return (
    <ServiceRequestMessages
      serviceRequestId={serviceRequestId}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      pageId="user-my-requests"
    />
  )
}
