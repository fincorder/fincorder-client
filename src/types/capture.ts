export type MessageRole = 'user' | 'assistant'

export type TransactionOperation = 'create' | 'update' | 'delete'
export type TransactionType = 'expense' | 'income' | 'transfer' | 'lend' | 'borrow' | 'repayment'
export type TransactionDirection = 'debit' | 'credit'

export interface TransactionProposal {
  draft_id?: string | null
  changed_fields?: string[]
  operation: TransactionOperation
  transaction_id: string | null
  type: TransactionType | null
  amount: string | number | null
  currency: string | null
  account: string | null
  category: string | null
  person: string | null
  description: string | null
  transaction_date: string | null
  clear_fields: string[]
  direction: TransactionDirection | null
}

export interface CaptureMessage {
  id: string
  role: MessageRole
  content: string
  proposal?: TransactionProposal[]
  financialEventId?: string
  captureStatus?: string
  revision?: number
}

export interface CaptureResponse {
  conversation_id: string
  message_id: string
  assistant_message_id: string | null
  financial_event_id: string
  status: string
  assistant_message: string
  needs_clarification: boolean
  missing_fields: string[]
  awaiting_confirmation: boolean
  proposed_transactions: TransactionProposal[]
  revision: number
  transaction_ids: string[]
}

export interface ConfirmCaptureResponse {
  financial_event_id: string
  status: string
  assistant_message: string
  transaction_ids: string[]
  revision: number
}

export type ReviewEventStatus = 'awaiting_confirmation' | 'needs_clarification' | 'failed'

export interface ReviewEvent {
  id: string
  conversation_id: string
  conversation_title: string | null
  source_message_id: string
  status: ReviewEventStatus
  raw_text: string
  extracted_data: { transactions?: TransactionProposal[] } | null
  missing_fields: string[] | null
  error: string | null
  assistant_message_id: string | null
  revision: number
  created_at: string
  updated_at: string
}

export interface ReviewEventPage {
  items: ReviewEvent[]
  total: number
  limit: number
  offset: number
  has_next: boolean
}
