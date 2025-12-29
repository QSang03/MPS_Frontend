export enum ChatRequestType {
  PURCHASE = 'purchase',
  SERVICE = 'service',
}

export enum ChatMessageAuthorType {
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER',
}

export interface ChatMessageEventDto {
  id: string
  purchaseRequestId?: string
  serviceRequestId?: string
  customerId: string
  authorId?: string
  authorType: ChatMessageAuthorType
  authorName?: string
  message: string
  statusBefore?: string
  statusAfter?: string
  createdAt: string
}

export interface ChatTypingEventDto {
  userId: string
  userName: string
  isTyping: boolean
}

export interface ChatReadEventDto {
  userId: string
  messageIds: string[]
  readAt: string
}

export interface ChatStatusEventDto {
  requestType: ChatRequestType | `${ChatRequestType}`
  requestId: string
  statusBefore?: string
  statusAfter?: string
  updatedBy?: string
  updatedAt?: string
}

export interface ChatErrorEventDto {
  message: string
}

export type JoinLeaveChatPayload = {
  requestType: ChatRequestType | `${ChatRequestType}`
  requestId: string
}

export type TypingPayload = {
  requestType: ChatRequestType | `${ChatRequestType}`
  requestId: string
  userId: string
  userName: string
  isTyping: boolean
}

export type MarkReadPayload = {
  requestType: ChatRequestType | `${ChatRequestType}`
  requestId: string
  userId: string
  messageIds: string[]
}
