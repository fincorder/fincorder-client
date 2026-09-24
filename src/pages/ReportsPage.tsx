import { useEffect, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { useAuth } from '../context/AuthContext'
import { ReportBody } from '../components/reports/ReportBody'
import { ReportFiltersBar } from '../components/reports/ReportFiltersBar'
import { exportReport, getReport, getReportOptions } from '../services/api/reports'
import type { ReportData, ReportFilters, ReportName, ReportOptions } from '../types/reports'

const tabs: { name: ReportName; label: string; description: string }[] = [
  { name: 'overview', label: 'Overview', description: 'Your financial activity at a glance.' },
  { name: 'spending', label: 'Spending', description: 'Where expenses went and how they changed.' },
  { name: 'income', label: 'Income', description: 'Income sources and trends.' },
  { name: 'categories', label: 'Categories', description: 'Compare your category activity.' },
  { name: 'accounts', label: 'Accounts', description: 'Activity across your accounts.' },
  { name: 'people', label: 'People', description: 'Lending, borrowing, repayments and shared spending.' },
  { name: 'activity', label: 'Activity', description: 'A read-only view of all recorded activity.' },
  { name: 'transfers', label: 'Transfers', description: 'Money moved between your accounts.' },
  { name: 'types', label: 'Types', description: 'Break down expenses, income and other transaction types.' },
  { name: 'quality', label: 'Data quality', description: 'Entries that may need better details.' },
  { name: 'pivot', label: 'Pivot', description: 'Compare dimensions across time and entities.' },
]

function defaultSort(view: ReportName) {
  if (view === 'people') return 'owed_to_you'
  if (view === 'pivot') return 'total'
  if (['spending', 'income', 'activity', 'transfers', 'quality'].includes(view)) return 'transaction_date'
  return 'amount'
}

function initialFilters(timezone = Intl.DateTimeFormat().resolvedOptions().timeZone, view: ReportName = 'overview'): ReportFilters {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: 'numeric' }).formatToParts(new Date())
  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value) - 1
  const date = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
  return { date_from: date(new Date(year, month, 1)), date_to: date(new Date(year, month + 1, 0)), currency: 'INR', granularity: 'day', sort_by: defaultSort(view), sort_order: 'desc', limit: 25, offset: 0, pivot_row: 'category', pivot_column: 'month', pivot_measure: 'amount' }
}

export function ReportsPage() {
  const { user } = useAuth()
  const { view: routeView } = useParams()
  const view = routeView as ReportName
  const tab = tabs.find((item) => item.name === view)
  const [filters, setFilters] = useState<ReportFilters>(() => initialFilters(user?.timezone, view))
  const [options, setOptions] = useState<ReportOptions>({ accounts: [], categories: [], people: [], currencies: ['INR'] })
  const [data, setData] = useState<ReportData>()
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getReportOptions().then(setOptions).catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!tab) return
    let active = true
    const timer = window.setTimeout(() => {
      getReport(tab.name, filters)
        .then((result) => { if (active) { setData(result); setError(''); setLoading(false) } })
        .catch((cause) => { if (active) { setError(cause instanceof Error ? cause.message : 'Could not load this report.'); setLoading(false) } })
    }, filters.search ? 250 : 0)
    return () => { active = false; window.clearTimeout(timer) }
  }, [tab, filters])

  if (!tab) return <Navigate to="/app/reports/overview" replace />

  function updateFilters(patch: Partial<ReportFilters>) {
    setFilters((current) => ({ ...current, ...patch, offset: patch.offset ?? 0 }))
    setLoading(true)
  }

  async function download() {
    setExporting(true)
    setError('')
    try { await exportReport(tab!.name, filters) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not export this report.') }
    finally { setExporting(false) }
  }

  return <AppShell><section className="w-full px-4 pb-28 sm:px-8 lg:px-12">
    <header className="flex flex-wrap items-end justify-between gap-4 py-6 sm:py-8"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">reports / {tab.name}</p><h1 className="mt-1 text-3xl font-black tracking-[-0.07em] text-slate-950 dark:text-white sm:text-4xl">{tab.label}</h1><p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{tab.description}</p></div><button type="button" disabled={exporting} onClick={() => void download()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-4 text-xs font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:opacity-60">{exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Export CSV</button></header>
    <nav aria-label="Report views" className="mb-4 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 dark:border-slate-800 dark:bg-[#0d1a2c]">{tabs.map((item) => <Link key={item.name} to={`/app/reports/${item.name}`} onClick={() => updateFilters({ offset: 0, sort_by: defaultSort(item.name) })} className={['shrink-0 rounded-xl px-3 py-2 text-[11px] font-black transition', item.name === tab.name ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:bg-orange-50 hover:text-orange-500 dark:text-slate-400 dark:hover:bg-slate-800'].join(' ')}>{item.label}</Link>)}</nav>
    <ReportFiltersBar filters={filters} onChange={updateFilters} options={options} timezone={user?.timezone} />
    {view === 'people' && <p className="mt-3 text-[11px] font-semibold text-slate-400">Owed amounts use all lending and repayment history through the selected end date. Account, category and text filters affect period activity, not the debt totals.</p>}
    {view === 'quality' && <p className="mt-3 text-[11px] font-semibold text-slate-400">Capture status counts use the date range. Currency and transaction filters apply to the transaction quality table.</p>}
    {error && <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
    <div className="mt-4">{loading || !data || data.report !== view ? <div className="flex justify-center py-24"><Loader2 size={25} className="animate-spin text-orange-500" /></div> : <ReportBody data={data} filters={filters} onChange={updateFilters} timezone={user?.timezone} />}</div>
  </section></AppShell>
}
