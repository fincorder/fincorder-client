import type { ReportName } from '../../types/reports'

export interface ReportColumn {
  key: string
  label: string
  money?: boolean
  date?: boolean
}

export const reportColumns: Record<ReportName, ReportColumn[]> = {
  overview: [{ key: 'transaction_date', label: 'Date', date: true }, { key: 'description', label: 'Expense' }, { key: 'category', label: 'Category' }, { key: 'account', label: 'Account' }, { key: 'amount', label: 'Amount', money: true }],
  spending: [{ key: 'transaction_date', label: 'Date', date: true }, { key: 'description', label: 'Description' }, { key: 'category', label: 'Category' }, { key: 'account', label: 'Account' }, { key: 'person', label: 'Person' }, { key: 'amount', label: 'Amount', money: true }],
  income: [{ key: 'transaction_date', label: 'Date', date: true }, { key: 'description', label: 'Description' }, { key: 'category', label: 'Category' }, { key: 'account', label: 'Account' }, { key: 'amount', label: 'Amount', money: true }],
  categories: [{ key: 'label', label: 'Category' }, { key: 'spending', label: 'Spending', money: true }, { key: 'income', label: 'Income', money: true }, { key: 'count', label: 'Entries' }, { key: 'amount', label: 'Total', money: true }],
  accounts: [{ key: 'label', label: 'Account' }, { key: 'debit', label: 'Debit', money: true }, { key: 'credit', label: 'Credit', money: true }, { key: 'transfer_volume', label: 'Transfers', money: true }, { key: 'count', label: 'Entries' }],
  people: [{ key: 'label', label: 'Person' }, { key: 'owed_to_you', label: 'They owe you', money: true }, { key: 'you_owe', label: 'You owe', money: true }, { key: 'net_position', label: 'Net', money: true }, { key: 'spending', label: 'Spent around them', money: true }, { key: 'last_activity', label: 'Last activity', date: true }],
  activity: [{ key: 'transaction_date', label: 'Date', date: true }, { key: 'description', label: 'Description' }, { key: 'type', label: 'Type' }, { key: 'direction', label: 'Direction' }, { key: 'account', label: 'Account' }, { key: 'amount', label: 'Amount', money: true }],
  transfers: [{ key: 'transaction_date', label: 'Date', date: true }, { key: 'from_account', label: 'From' }, { key: 'to_account', label: 'To' }, { key: 'description', label: 'Description' }, { key: 'amount', label: 'Amount', money: true }],
  types: [{ key: 'label', label: 'Type' }, { key: 'debit', label: 'Debit', money: true }, { key: 'credit', label: 'Credit', money: true }, { key: 'count', label: 'Entries' }, { key: 'amount', label: 'Total', money: true }],
  quality: [{ key: 'transaction_date', label: 'Date', date: true }, { key: 'description', label: 'Description' }, { key: 'type', label: 'Type' }, { key: 'issues', label: 'Needs attention' }, { key: 'amount', label: 'Amount', money: true }],
  pivot: [{ key: 'label', label: 'Dimension' }, { key: 'total', label: 'Total', money: true }],
}
