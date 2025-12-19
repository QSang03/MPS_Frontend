import { io, Socket } from 'socket.io-client'

// Create socket connection to current domain
export const createSocket = (): Socket => {
  const socket = io({
    path: '/socket.io/',
    // Use current domain, Nginx will proxy to backend
    // No need to specify host, it defaults to current origin
  })

  return socket
}

// Export a singleton socket instance if needed
export const socket = createSocket()
