import { apiRequest } from './client'
import type { CaptureResponse, ConfirmCaptureResponse, TransactionProposal } from '../../types/capture'

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
}

export function captureTransaction(message: string, conversationId?: string) {
  return apiRequest<CaptureResponse>('/capture', {
    method: 'POST',
    body: JSON.stringify({
      message,
      conversation_id: conversationId ?? null,
    }),
  })
}

export function getConversationMessages(conversationId: string) {
  return apiRequest<ConversationMessageResponse[]>(`/conversations/${conversationId}/messages`)
}

export function getConversationFinancialEvents(conversationId: string) {
  return apiRequest<FinancialEventResponse[]>(`/financial-events/conversation/${conversationId}`)
}

export function confirmCapture(financialEventId: string, transactions: TransactionProposal[]) {
  return apiRequest<ConfirmCaptureResponse>(`/capture/${financialEventId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ transactions }),
  })
}

export function rejectCapture(financialEventId: string) {
  return apiRequest<ConfirmCaptureResponse>(`/capture/${financialEventId}/reject`, { method: 'POST' })
}
