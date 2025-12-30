import { clientApiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { CreateLeadDto } from '@/lib/validations/lead.schema'

export async function createLead(payload: CreateLeadDto) {
  const resp = await clientApiClient.post(API_ENDPOINTS.LEADS.CREATE, payload)
  return resp.data
}
