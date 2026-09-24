export type ReportName = 'overview' | 'spending' | 'income' | 'categories' | 'accounts' | 'people' | 'activity' | 'transfers' | 'types' | 'quality' | 'pivot'

export interface ReportFilters {
  date_from?: string
  date_to?: string
  currency: string
  account_id?: string
  category_id?: string
  person_id?: string
  type?: string
  direction?: string
  search?: string
  granularity: 'day' | 'week' | 'month'
  sort_by: string
  sort_order: 'asc' | 'desc'
  limit: number
  offset: number
  pivot_row: string
  pivot_column: string
  pivot_measure: string
}

export interface ReportBreakdown {
  key: string
  label: string
  amount: string
  count: number
  debit: string
  credit: string
  spending: string
  income: string
  previous_spending?: string
  spending_change?: string
}

export interface ReportTrend {
  period: string
  spending: string
  income: string
  lent: string
  borrowed: string
  repayment_sent: string
  repayment_received: string
  transfer_volume: string
  count: number
}

export interface ReportData {
  report: ReportName
  currency: string
  date_from: string | null
  date_to: string | null
  metrics: Record<string, string | number>
  comparison: { date_from: string; date_to: string; spending: string; income: string } | null
  trend: ReportTrend[]
  breakdowns: Record<'categories' | 'accounts' | 'people' | 'types' | 'people_owed' | 'people_payable' | 'category_comparison', ReportBreakdown[]>
  rows: Record<string, unknown>[]
  pivot_columns: string[]
  total: number
  limit: number
  offset: number
  has_next: boolean
}

export interface ReportOptions {
  accounts: { id: string; name: string; currency: string }[]
  categories: { id: string; name: string }[]
  people: { id: string; name: string }[]
  currencies: string[]
}
