export type MessageRole = 'user' | 'assistant'

export type TransactionOperation = 'create' | 'update' | 'delete'
export type TransactionType = 'expense' | 'income' | 'transfer' | 'lend' | 'borrow' | 'repayment'
export type TransactionDirection = 'debit' | 'credit'

export interface TransactionProposal {
  operation: TransactionOperation
  transaction_id: string | null
  type: TransactionType | null
  amount: string | number | null
  currency: string
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
}

export interface ConfirmCaptureResponse {
  financial_event_id: string
  status: string
  assistant_message: string
  transaction_ids: string[]
}
