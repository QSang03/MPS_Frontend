/**
 * Authentication API Service
 *
 * This file re-exports client and server services.
 * Client components should import from auth-client.service.ts directly
 * Server components can import from auth-server.service.ts directly
 *
 * For backward compatibility, this file exports client methods only
 * (to avoid importing server-only code in client components)
 */
export { authClientService as authService } from './auth-client.service'
export { authServerService } from './auth-server.service'
