import type { ReportData, ReportFilters, ReportName } from '../../types/reports'
import { BreakdownChart, MetricCards, TrendChart } from './ReportCharts'
import { CategoryComparison } from './CategoryComparison'
import { ReportTable } from './ReportTable'
import { currencyValue } from './format'

interface Props {
  data: ReportData
  filters: ReportFilters
  onChange: (patch: Partial<ReportFilters>) => void
  timezone?: string
}

export function ReportBody({ data, filters, onChange, timezone }: Props) {
  const metrics = data.metrics
  const card = (label: string, key: string, count = false, hint?: string) => ({ label, value: metrics[key], count, hint })
  const changeHint = (key: string) => data.comparison ? `${Number(metrics[key]) >= 0 ? '+' : ''}${currencyValue(metrics[key], data.currency)} vs previous period` : undefined
  const cards: Record<ReportName, ReturnType<typeof card>[]> = {
    overview: [card('Spending', 'spending', false, changeHint('spending_change')), card('Income', 'income', false, changeHint('income_change')), card('Net flow', 'net_flow'), card('Transactions', 'transactions', true)],
    spending: [card('Total spent', 'spending', false, changeHint('spending_change')), card('Expenses', 'expense_count', true), card('Average expense', 'average_expense'), card('Largest expense', 'largest_expense')],
    income: [card('Total income', 'income', false, changeHint('income_change')), card('Income entries', 'income_count', true), card('Largest income', 'largest_income'), card('Net flow', 'net_flow')],
    categories: [card('Categories used', 'categories_used', true), card('Uncategorized', 'uncategorized_count', true), card('Spending', 'spending'), card('Income', 'income')],
    accounts: [card('Accounts used', 'accounts_used', true), card('Spending', 'spending'), card('Income', 'income'), card('Transfer volume', 'transfer_volume')],
    people: [card('They owe you', 'owed_to_you', false, 'All history through the selected end date'), card('You owe', 'you_owe', false, 'All history through the selected end date'), card('Lent this period', 'lent'), card('Borrowed this period', 'borrowed')],
    activity: [card('Transactions', 'transactions', true), card('Debit expenses', 'spending'), card('Income credits', 'income'), card('Net flow', 'net_flow')],
    transfers: [card('Transfer volume', 'transfer_volume'), card('Transfers', 'transfer_count', true), card('Largest transfer', 'largest_transfer'), card('Accounts involved', 'accounts_involved', true)],
    types: [card('Expenses', 'spending'), card('Income', 'income'), card('Lent', 'lent'), card('Borrowed', 'borrowed')],
    quality: [card('Entries with issues', 'quality_issues', true), card('Pending review', 'pending_review', true), card('Needs clarification', 'needs_clarification', true), card('Failed captures', 'failed_captures', true)],
    pivot: [card('Transactions', 'transactions', true), card('Spending', 'spending'), card('Income', 'income'), card('Net flow', 'net_flow')],
  }
  const view = data.report

  function changePivotDimension(key: 'pivot_row' | 'pivot_column', value: string) {
    const other = key === 'pivot_row' ? 'pivot_column' : 'pivot_row'
    onChange(value === filters[other] ? { [key]: value, [other]: filters[key] } : { [key]: value })
  }

  return <div className="space-y-4 animate-message-in">
    <MetricCards items={cards[view]} currency={data.currency} />
    {view === 'pivot' && <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-[#0d1a2c]">{([['pivot_row', 'Rows'], ['pivot_column', 'Columns']] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2 text-xs font-black text-slate-500">{label}<select value={filters[key]} onChange={(event) => changePivotDimension(key, event.target.value)} className="h-9 rounded-xl bg-slate-50 px-2 text-xs font-bold outline-none dark:bg-slate-800 dark:text-slate-200">{['category', 'account', 'person', 'type', 'month'].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>)}<label className="flex items-center gap-2 text-xs font-black text-slate-500">Measure<select value={filters.pivot_measure} onChange={(event) => onChange({ pivot_measure: event.target.value })} className="h-9 rounded-xl bg-slate-50 px-2 text-xs font-bold outline-none dark:bg-slate-800 dark:text-slate-200">{['amount', 'count', 'debit', 'credit', 'average'].map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div>}
    {['overview', 'spending', 'income', 'activity', 'transfers', 'people'].includes(view) && <TrendChart data={data.trend} currency={data.currency} keys={view === 'transfers' ? ['transfer_volume'] : view === 'people' ? ['lent', 'borrowed', 'repayment_received'] : view === 'income' ? ['income'] : view === 'spending' ? ['spending'] : ['spending', 'income']} title={view === 'transfers' ? 'Transfer volume over time' : 'Activity over time'} />}
    {['overview', 'spending', 'income', 'categories', 'accounts', 'people', 'types'].includes(view) && <div className="grid gap-4 lg:grid-cols-2">{view === 'people' ? <><BreakdownChart data={data.breakdowns.people_owed} currency={data.currency} title="Owed to you" /><BreakdownChart data={data.breakdowns.people_payable} currency={data.currency} title="You owe" /></> : view === 'income' ? <><BreakdownChart data={data.breakdowns.accounts} currency={data.currency} title="Income by account" field="income" /><BreakdownChart data={data.breakdowns.categories} currency={data.currency} title="Income categories" field="income" /></> : <><BreakdownChart data={data.breakdowns.categories} currency={data.currency} title="Spending by category" field="spending" /><BreakdownChart data={view === 'types' ? data.breakdowns.types : data.breakdowns.accounts} currency={data.currency} title={view === 'types' ? 'Activity by type' : 'Activity by account'} /></>}</div>}
    {view === 'people' && <BreakdownChart data={data.breakdowns.people} currency={data.currency} title="Spent around people" field="spending" />}
    {['spending', 'categories'].includes(view) && <CategoryComparison data={data} />}
    <ReportTable data={data} filters={filters} onChange={onChange} timezone={timezone} />
  </div>
}
