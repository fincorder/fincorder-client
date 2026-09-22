import type { TransactionDirection, TransactionType } from './capture'

export interface TransactionRecord {
  id: string
  transaction_group_id: string
  account_id: string
  category_id: string | null
  person_id: string | null
  type: TransactionType
  direction: TransactionDirection
  amount: string
  currency: string
  description: string | null
  transaction_date: string
}

export interface TransactionPayload {
  account_id: string
  category_id?: string | null
  person_id?: string | null
  type: TransactionType
  direction: TransactionDirection
  amount: string
  currency: string
  description?: string | null
  transaction_date: string
}

export type TransactionUpdatePayload = Partial<Omit<TransactionPayload, 'account_id'>> & { account_id?: string | null }

export interface TransactionPage {
  items: TransactionRecord[]
  total: number
  limit: number
  offset: number
  has_next: boolean
}

export type TransactionFilterType = TransactionType | 'all'
export type TransactionFilterDirection = TransactionDirection | 'all'
