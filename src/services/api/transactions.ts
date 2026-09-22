import { apiRequest } from './client'
import type { TransactionFilterDirection, TransactionFilterType, TransactionPage, TransactionPayload, TransactionRecord, TransactionUpdatePayload } from '../../types/transactions'

export function getTransactions(filters?: { search?: string; type?: TransactionFilterType; direction?: TransactionFilterDirection }) {
  const params = new URLSearchParams({ limit: '100' })
  if (filters?.search) params.set('search', filters.search)
  if (filters?.type && filters.type !== 'all') params.set('type', filters.type)
  if (filters?.direction && filters.direction !== 'all') params.set('direction', filters.direction)
  return apiRequest<TransactionRecord[]>(`/transactions?${params.toString()}`)
}

export function getTransactionsPage(filters: {
  limit: number
  offset: number
  search?: string
  type?: TransactionFilterType
  direction?: TransactionFilterDirection
  accountId?: string
  categoryId?: string
  personId?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: 'transaction_date' | 'amount' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}) {
  const params = new URLSearchParams({ limit: String(filters.limit), offset: String(filters.offset) })
  if (filters.search) params.set('search', filters.search)
  if (filters.type && filters.type !== 'all') params.set('type', filters.type)
  if (filters.direction && filters.direction !== 'all') params.set('direction', filters.direction)
  if (filters.accountId) params.set('account_id', filters.accountId)
  if (filters.categoryId) params.set('category_id', filters.categoryId)
  if (filters.personId) params.set('person_id', filters.personId)
  if (filters.dateFrom) params.set('date_from', `${filters.dateFrom}T00:00:00Z`)
  if (filters.dateTo) params.set('date_to', `${filters.dateTo}T23:59:59Z`)
  if (filters.sortBy) params.set('sort_by', filters.sortBy)
  if (filters.sortOrder) params.set('sort_order', filters.sortOrder)
  return apiRequest<TransactionPage>(`/transactions/page?${params.toString()}`)
}

export function createManualTransaction(payload: TransactionPayload) {
  return apiRequest<TransactionRecord>('/transactions/manual', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateTransaction(id: string, payload: TransactionUpdatePayload) {
  return apiRequest<TransactionRecord>(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export function archiveTransaction(id: string) {
  return apiRequest<void>(`/transactions/${id}`, { method: 'DELETE' })
}
