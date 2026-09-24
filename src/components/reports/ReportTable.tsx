import type { ReportData, ReportFilters } from '../../types/reports'
import { currencyValue } from './format'
import { reportColumns, type ReportColumn } from './columns'

function format(value: unknown, column: ReportColumn, currency: string, timezone?: string) {
  if (value === null || value === undefined || value === '') return '—'
  if (column.money) return currencyValue(value as string | number, currency)
  if (column.date) return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: timezone }).format(new Date(String(value)))
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

export function ReportTable({ data, filters, onChange, timezone }: { data: ReportData; filters: ReportFilters; onChange: (patch: Partial<ReportFilters>) => void; timezone?: string }) {
  const visibleColumns: ReportColumn[] = data.report === 'pivot' ? [{ key: 'label', label: filters.pivot_row }, ...data.pivot_columns.map((column) => ({ key: column, label: column, money: filters.pivot_measure !== 'count' })), { key: 'total', label: 'Total', money: filters.pivot_measure !== 'count' }] : reportColumns[data.report]
  const title = data.report === 'overview' ? 'Largest expenses' : data.report === 'pivot' ? 'Pivot table' : `${data.report[0].toUpperCase() + data.report.slice(1)} table`
  const sortOptions = data.report === 'people' ? [['owed_to_you', 'Owed to you'], ['you_owe', 'You owe'], ['net_position', 'Net'], ['spending', 'Spending'], ['label', 'Name']] : data.report === 'pivot' ? [['total', 'Total'], ['label', 'Name']] : ['spending', 'income', 'activity', 'transfers', 'quality'].includes(data.report) ? [['transaction_date', 'Date'], ['amount', 'Amount']] : [['amount', 'Amount'], ['count', 'Count'], ['label', 'Name']]
  function cell(row: Record<string, unknown>, column: ReportColumn) {
    const value = data.report === 'pivot' && column.key !== 'label' && column.key !== 'total' ? (row.cells as Record<string, unknown>)?.[column.key] : row[column.key]
    const display = format(value, column, data.currency, timezone)
    if (column.key === 'label' && row.key && ['accounts', 'categories', 'people'].includes(data.report) && row.key !== 'None') {
      const field = data.report === 'accounts' ? 'account_id' : data.report === 'categories' ? 'category_id' : 'person_id'
      return <button type="button" onClick={() => onChange({ [field]: String(row.key) })} className="font-black text-orange-600 hover:underline dark:text-orange-300">{display}</button>
    }
    return display
  }
  return <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0d1a2c]">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-800"><h3 className="text-sm font-black text-slate-900 dark:text-white">{title}</h3>{data.report !== 'overview' && <div className="flex gap-2"><select aria-label="Sort by" value={filters.sort_by} onChange={(event) => onChange({ sort_by: event.target.value })} className="rounded-lg bg-slate-50 px-2 py-1.5 text-[11px] font-bold text-slate-500 outline-none dark:bg-slate-800 dark:text-slate-300">{sortOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button type="button" onClick={() => onChange({ sort_order: filters.sort_order === 'desc' ? 'asc' : 'desc' })} className="rounded-lg bg-slate-50 px-2 py-1.5 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">{filters.sort_order === 'desc' ? '↓' : '↑'}</button></div>}</div>
    <div className="overflow-x-auto"><table className="w-full min-w-[680px] border-collapse text-left"><thead><tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/30">{visibleColumns.map((column) => <th key={column.key} className="whitespace-nowrap px-4 py-3 first:pl-5">{column.label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{data.rows.map((row, index) => <tr key={String(row.id ?? row.key ?? row.label ?? index)} className="text-xs font-semibold text-slate-600 transition hover:bg-orange-50/40 dark:text-slate-300 dark:hover:bg-orange-500/[0.04]">{visibleColumns.map((column) => <td key={column.key} className="max-w-[260px] truncate whitespace-nowrap px-4 py-3 first:pl-5">{cell(row, column)}</td>)}</tr>)}</tbody></table>{data.rows.length === 0 && <p className="py-16 text-center text-xs font-semibold text-slate-400">No rows for the selected filters.</p>}</div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 dark:border-slate-800"><p className="text-[11px] font-semibold text-slate-400">{data.total ? filters.offset + 1 : 0}–{Math.min(filters.offset + filters.limit, data.total)} of {data.total}</p><div className="flex items-center gap-2"><button type="button" disabled={filters.offset === 0} onClick={() => onChange({ offset: Math.max(0, filters.offset - filters.limit) })} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-black text-slate-500 disabled:opacity-40 dark:border-slate-700">Previous</button><span className="text-[11px] font-bold text-slate-400">{Math.floor(filters.offset / filters.limit) + 1} / {Math.max(1, Math.ceil(data.total / filters.limit))}</span><button type="button" disabled={!data.has_next} onClick={() => onChange({ offset: filters.offset + filters.limit })} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-black text-slate-500 disabled:opacity-40 dark:border-slate-700">Next</button></div></div>
  </div>
}
