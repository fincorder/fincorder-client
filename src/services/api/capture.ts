import { apiRequest } from './client'
import type { CaptureResponse, ConfirmCaptureResponse, ReviewEventPage, TransactionProposal } from '../../types/capture'

interface ConversationMessageResponse {
  id: string
  role: string
  content: string
}

interface FinancialEventResponse {
  id: string
  status: string
  missing_fields: string[] | null
  extracted_data?: { transactions?: TransactionProposal[] }
  assistant_message_id: string | null
  revision: number
}

export function captureTransaction(message: string, conversationId?: string, requestId: string = crypto.randomUUID(), financialEventId?: string) {
  return apiRequest<CaptureResponse>('/capture', {
    method: 'POST',
    body: JSON.stringify({
      message,
      conversation_id: conversationId ?? null,
      request_id: requestId,
      financial_event_id: financialEventId ?? null,
    }),
  })
}

export function getConversationMessages(conversationId: string) {
  return apiRequest<ConversationMessageResponse[]>(`/conversations/${conversationId}/messages`)
}

export function getConversationFinancialEvents(conversationId: string) {
  return apiRequest<FinancialEventResponse[]>(`/financial-events/conversation/${conversationId}`)
}

export function getReviewEvents(params: { search?: string; month?: string; limit?: number; offset?: number } = {}) {
  const query = new URLSearchParams()
  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.month) query.set('month', params.month)
  query.set('limit', String(params.limit ?? 25))
  query.set('offset', String(params.offset ?? 0))
  return apiRequest<ReviewEventPage>(`/financial-events/review?${query.toString()}`)
}

export function confirmCapture(financialEventId: string, transactions: TransactionProposal[], revision = 1) {
  return apiRequest<ConfirmCaptureResponse>(`/capture/${financialEventId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ transactions, revision }),
  })
}

export function rejectCapture(financialEventId: string) {
  return apiRequest<ConfirmCaptureResponse>(`/capture/${financialEventId}/reject`, { method: 'POST' })
}

export function saveCaptureDraft(financialEventId: string, transactions: TransactionProposal[], revision: number) {
  return apiRequest<ConfirmCaptureResponse>(`/capture/${financialEventId}/draft`, { method: 'PATCH', body: JSON.stringify({ transactions, revision }) })
}
