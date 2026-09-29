import type { ReportData, ReportFilters, ReportName } from '../../types/reports'
import { BreakdownChart, MetricCards, TrendChart } from './ReportCharts'
import { ReportTable } from './ReportTable'
import { currencyValue } from './format'

interface Props {
  data: ReportData
  view: ReportName
  filters: ReportFilters
  onChange: (patch: Partial<ReportFilters>) => void
  timezone?: string
}

export function ReportBody({ data, view, filters, onChange, timezone }: Props) {
  const spendingChange = Number(data.metrics.spending_change ?? 0)
  const comparisonHint = data.comparison
    ? `${spendingChange > 0 ? '+' : ''}${currencyValue(spendingChange, data.currency)} vs previous period`
    : undefined

  if (view === 'categories') {
    return <div className="space-y-3 animate-message-in">
      <p className="px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Expense totals by category. Choose a month range to compare how your spending changes over time.</p>
      <ReportTable data={data} filters={filters} onChange={onChange} timezone={timezone} title="Monthly spending by category" />
    </div>
  }

  if (view === 'people') {
    return <div className="space-y-4 animate-message-in">
      <MetricCards items={[
        { label: 'They owe you', value: data.metrics.owed_to_you, hint: 'Outstanding across all recorded history' },
        { label: 'You owe', value: data.metrics.you_owe, hint: 'Outstanding across all recorded history' },
      ]} currency={data.currency} />
      <ReportTable data={data} filters={filters} onChange={onChange} timezone={timezone} title="People and settlements" />
    </div>
  }

  return <div className="space-y-4 animate-message-in">
    <MetricCards items={[
      { label: 'Spent this period', value: data.metrics.spending, hint: comparisonHint },
      { label: 'Transactions', value: data.metrics.transactions, count: true },
    ]} currency={data.currency} />
    <TrendChart data={data.trend} currency={data.currency} keys={['spending']} title="Spending over time" />
    <BreakdownChart data={data.breakdowns.categories} currency={data.currency} title="Top spending categories" field="spending" />
  </div>
}
