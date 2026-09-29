import { useEffect, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { useAuth } from '../context/AuthContext'
import { ReportBody } from '../components/reports/ReportBody'
import { ReportFiltersBar } from '../components/reports/ReportFiltersBar'
import { exportReport, getReport, getReportOptions } from '../services/api/reports'
import type { ReportData, ReportFilters, ReportName, ReportOptions } from '../types/reports'

const tabs: { name: ReportName; apiView: ReportName; label: string; description: string }[] = [
  { name: 'overview', apiView: 'overview', label: 'Overview', description: 'A quick look at your spending this month.' },
  { name: 'categories', apiView: 'pivot', label: 'By category', description: 'Compare category spending month by month.' },
  { name: 'people', apiView: 'people', label: 'People', description: 'See what you owe and what others owe you.' },
]

function defaultSort(view: ReportName) {
  if (view === 'people') return 'owed_to_you'
  if (view === 'pivot' || view === 'categories') return 'total'
  return 'amount'
}

function initialFilters(timezone = Intl.DateTimeFormat().resolvedOptions().timeZone, view: ReportName = 'overview'): ReportFilters {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date())
  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value) - 1
  const day = Number(parts.find((part) => part.type === 'day')?.value)
  const date = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
  const yearToDate = view === 'categories'
  return { date_from: date(new Date(year, yearToDate ? 0 : month, 1)), date_to: date(new Date(year, month, yearToDate ? day : new Date(year, month + 1, 0).getDate())), currency: 'INR', granularity: yearToDate ? 'month' : 'day', sort_by: defaultSort(yearToDate ? 'pivot' : view), sort_order: 'desc', limit: yearToDate ? 100 : 25, offset: 0, pivot_row: 'category', pivot_column: 'month', pivot_measure: 'amount' }
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
    const requestFilters = tab.name === 'categories' ? { ...filters, type: 'expense', direction: 'debit', pivot_row: 'category', pivot_column: 'month', pivot_measure: 'amount' } : filters
    const timer = window.setTimeout(() => {
      getReport(tab.apiView, requestFilters)
        .then((result) => { if (active) { setData(result); setError(''); setLoading(false) } })
        .catch((cause) => { if (active) { setError(cause instanceof Error ? cause.message : 'Could not load this report.'); setLoading(false) } })
    }, filters.search ? 250 : 0)
    return () => { active = false; window.clearTimeout(timer) }
  }, [tab, filters])

  useEffect(() => {
    if (!tab) return
    setFilters(initialFilters(user?.timezone, tab.name))
    setLoading(true)
  }, [tab?.name, user?.timezone])

  if (!tab) return <Navigate to="/app/reports/overview" replace />

  function updateFilters(patch: Partial<ReportFilters>) {
    setFilters((current) => ({ ...current, ...patch, offset: patch.offset ?? 0 }))
    setLoading(true)
  }

  async function download() {
    setExporting(true)
    setError('')
    const exportFilters = tab!.name === 'categories' ? { ...filters, type: 'expense', direction: 'debit', pivot_row: 'category', pivot_column: 'month', pivot_measure: 'amount' } : filters
    try { await exportReport(tab!.apiView, exportFilters, tab!.name) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not export this report.') }
    finally { setExporting(false) }
  }

  return <AppShell><section className="mx-auto w-full max-w-[1500px] px-4 pb-28 sm:px-8 lg:px-12">
    <header className="flex flex-wrap items-end justify-between gap-4 py-6 sm:py-8"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">reports / {tab.name}</p><h1 className="mt-1 text-3xl font-black tracking-[-0.07em] text-slate-950 dark:text-white sm:text-4xl">{tab.label}</h1><p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{tab.description}</p></div><button type="button" disabled={exporting} onClick={() => void download()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-4 text-xs font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:opacity-60">{exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Export CSV</button></header>
    <nav aria-label="Report views" className="mb-4 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 dark:border-slate-800 dark:bg-[#0d1a2c]">{tabs.map((item) => <Link key={item.name} to={`/app/reports/${item.name}`} onClick={() => updateFilters({ offset: 0, sort_by: defaultSort(item.name) })} className={['shrink-0 rounded-xl px-3 py-2 text-[11px] font-black transition', item.name === tab.name ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:bg-orange-50 hover:text-orange-500 dark:text-slate-400 dark:hover:bg-slate-800'].join(' ')}>{item.label}</Link>)}</nav>
    <ReportFiltersBar key={tab.name} filters={filters} onChange={updateFilters} options={options} timezone={user?.timezone} initialPreset={tab.name === 'categories' ? 'year' : 'current'} showTransactionFilters={tab.name !== 'categories'} showChartGrouping={tab.name !== 'categories'} />
    {view === 'people' && <p className="mt-3 text-[11px] font-semibold text-slate-400">Owed amounts use all lending and repayment history through the selected end date. Account, category and text filters affect period activity, not the debt totals.</p>}
    {error && <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
    <div className="mt-4">{loading || !data || data.report !== tab.apiView ? <div className="flex justify-center py-24"><Loader2 size={25} className="animate-spin text-orange-500" /></div> : <ReportBody data={data} view={tab.name} filters={filters} onChange={updateFilters} timezone={user?.timezone} />}</div>
  </section></AppShell>
}
