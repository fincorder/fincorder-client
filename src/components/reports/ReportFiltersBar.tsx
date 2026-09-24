import { useState } from 'react'
import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react'
import type { ReportFilters, ReportOptions } from '../../types/reports'

interface Props {
  filters: ReportFilters
  onChange: (patch: Partial<ReportFilters>) => void
  options: ReportOptions
  timezone?: string
}

const inputClass = 'h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-orange-400 dark:border-slate-700 dark:bg-[#101d31] dark:text-slate-200'

function dateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function ReportFiltersBar({ filters, onChange, options, timezone }: Props) {
  const [advanced, setAdvanced] = useState(false)
  const [preset, setPreset] = useState('current')
  const { accounts, categories, people, currencies } = options

  function changePreset(next: string) {
    setPreset(next)
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date())
    const year = Number(parts.find((part) => part.type === 'year')?.value)
    const monthNumber = Number(parts.find((part) => part.type === 'month')?.value) - 1
    const day = Number(parts.find((part) => part.type === 'day')?.value)
    const now = new Date(year, monthNumber, day)
    if (next === 'all') return onChange({ date_from: undefined, date_to: undefined, granularity: 'month' })
    if (next === 'custom' || next === 'month') return
    if (next === 'year') return onChange({ date_from: dateString(new Date(now.getFullYear(), 0, 1)), date_to: dateString(now), granularity: 'month' })
    const month = next === 'previous' ? now.getMonth() - 1 : now.getMonth()
    onChange({ date_from: dateString(new Date(now.getFullYear(), month, 1)), date_to: dateString(new Date(now.getFullYear(), month + 1, 0)), granularity: 'day' })
  }

  return <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-[#0d1a2c] sm:p-4">
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[180px] flex-1"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={filters.search ?? ''} onChange={(event) => onChange({ search: event.target.value })} placeholder="Search descriptions or names" className={`${inputClass} w-full pl-9`} /></div>
      <div className="relative"><select value={preset} onChange={(event) => changePreset(event.target.value)} className={`${inputClass} appearance-none pr-8`}><option value="current">This month</option><option value="previous">Last month</option><option value="month">Choose month</option><option value="year">Year to date</option><option value="all">All dates</option><option value="custom">Custom range</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-3.5 text-slate-400" /></div>
      {preset === 'month' && <input type="month" aria-label="Selected month" value={filters.date_from?.slice(0, 7) ?? ''} onChange={(event) => { if (!event.target.value) return; const [year, month] = event.target.value.split('-').map(Number); onChange({ date_from: dateString(new Date(year, month - 1, 1)), date_to: dateString(new Date(year, month, 0)), granularity: 'day' }) }} className={inputClass} />}
      <select value={filters.currency} onChange={(event) => onChange({ currency: event.target.value })} aria-label="Currency" className={inputClass}>{currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}</select>
      <button type="button" onClick={() => setAdvanced((current) => !current)} aria-expanded={advanced} className={`${inputClass} inline-flex items-center gap-2 hover:border-orange-300`}><SlidersHorizontal size={14} /> Filters <ChevronDown size={12} className={advanced ? 'rotate-180 transition' : 'transition'} /></button>
    </div>
    {(advanced || preset === 'custom') && <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
      {preset === 'custom' && <><label className="flex items-center gap-2 text-[11px] font-bold text-slate-500">From<input type="date" value={filters.date_from ?? ''} onChange={(event) => onChange({ date_from: event.target.value || undefined })} className={inputClass} /></label><label className="flex items-center gap-2 text-[11px] font-bold text-slate-500">To<input type="date" value={filters.date_to ?? ''} onChange={(event) => onChange({ date_to: event.target.value || undefined })} className={inputClass} /></label></>}
      {advanced && <>
        <select aria-label="Account" value={filters.account_id ?? ''} onChange={(event) => onChange({ account_id: event.target.value || undefined })} className={inputClass}><option value="">All accounts</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select>
        <select aria-label="Category" value={filters.category_id ?? ''} onChange={(event) => onChange({ category_id: event.target.value || undefined })} className={inputClass}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
        <select aria-label="Person" value={filters.person_id ?? ''} onChange={(event) => onChange({ person_id: event.target.value || undefined })} className={inputClass}><option value="">All people</option>{people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select>
        <select aria-label="Transaction type" value={filters.type ?? ''} onChange={(event) => onChange({ type: event.target.value || undefined })} className={inputClass}><option value="">All types</option>{['expense', 'income', 'transfer', 'lend', 'borrow', 'repayment'].map((type) => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}</select>
        <select aria-label="Direction" value={filters.direction ?? ''} onChange={(event) => onChange({ direction: event.target.value || undefined })} className={inputClass}><option value="">Debit + Credit</option><option value="debit">Debit</option><option value="credit">Credit</option></select>
        <select aria-label="Chart grouping" value={filters.granularity} onChange={(event) => onChange({ granularity: event.target.value as ReportFilters['granularity'] })} className={inputClass}><option value="day">Daily chart</option><option value="week">Weekly chart</option><option value="month">Monthly chart</option></select>
        <button type="button" onClick={() => onChange({ account_id: undefined, category_id: undefined, person_id: undefined, type: undefined, direction: undefined, search: undefined })} className="px-2 text-xs font-black text-orange-500">Clear filters</button>
      </>}
    </div>}
  </div>
}
