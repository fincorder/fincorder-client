import type { ReportBreakdown, ReportTrend } from '../../types/reports'
import { currencyValue } from './format'

export function MetricCards({ items, currency }: { items: { label: string; value: string | number | undefined; count?: boolean; hint?: string }[]; currency: string }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{items.map((item) => <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-[#0d1a2c]"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{item.label}</p><p className="mt-2 truncate text-2xl font-black tracking-[-0.06em] text-slate-900 dark:text-white">{item.count ? Number(item.value ?? 0).toLocaleString('en-IN') : currencyValue(item.value, currency)}</p>{item.hint && <p className="mt-1 text-[11px] font-semibold text-slate-400">{item.hint}</p>}</div>)}</div>
}

export function TrendChart({ data, currency, keys = ['spending', 'income'], title = 'Activity over time' }: { data: ReportTrend[]; currency: string; keys?: (keyof ReportTrend)[]; title?: string }) {
  const visible = data.slice(-24)
  const colors = ['#f97316', '#38bdf8', '#8b5cf6']
  const max = Math.max(1, ...visible.flatMap((row) => keys.map((key) => Number(row[key] || 0))))
  const x = (index: number) => 24 + (visible.length === 1 ? 0 : index * 712 / (visible.length - 1))
  const y = (value: number) => 188 - value * 160 / max
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0d1a2c]"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-black text-slate-900 dark:text-white">{title}</h3><p className="mt-1 text-[11px] font-semibold text-slate-400">{visible.length} periods · {currency}</p></div><div className="flex gap-3">{keys.map((key, index) => <span key={key} className="flex items-center gap-1 text-[10px] font-bold capitalize text-slate-500"><span className="size-2 rounded-full" style={{ backgroundColor: colors[index] }} />{String(key).replaceAll('_', ' ')}</span>)}</div></div>
    {visible.length ? <div className="mt-5 overflow-x-auto"><svg viewBox="0 0 760 225" role="img" aria-label={`${title} chart`} className="min-w-[520px] w-full"><line x1="24" x2="736" y1="188" y2="188" stroke="#94a3b8" opacity=".35" />{keys.map((key, index) => <g key={key}><polyline fill="none" stroke={colors[index]} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={visible.map((row, position) => `${x(position)},${y(Number(row[key] || 0))}`).join(' ')} />{visible.map((row, position) => <circle key={`${row.period}-${key}`} cx={x(position)} cy={y(Number(row[key] || 0))} r="4" fill={colors[index]}><title>{row.period}: {String(key)} {currencyValue(row[key], currency)}</title></circle>)}</g>)}<text x="24" y="215" fill="#94a3b8" fontSize="12">{visible[0]?.period}</text><text x="736" y="215" fill="#94a3b8" fontSize="12" textAnchor="end">{visible.at(-1)?.period}</text></svg></div> : <p className="py-14 text-center text-xs font-semibold text-slate-400">No activity for these filters.</p>}
  </div>
}

export function BreakdownChart({ data, currency, title, field = 'amount' }: { data: ReportBreakdown[]; currency: string; title: string; field?: keyof ReportBreakdown }) {
  const rows = [...data].sort((a, b) => Number(b[field]) - Number(a[field])).slice(0, 8)
  const max = Math.max(1, ...rows.map((row) => Number(row[field])))
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800"><h3 className="text-sm font-black text-slate-900 dark:text-white">{title}</h3>{rows.length ? <div className="mt-5 space-y-4">{rows.map((row) => <div key={row.key}><div className="mb-1.5 flex justify-between gap-2 text-[11px] font-bold"><span className="truncate text-slate-600 dark:text-slate-300">{row.label}</span><span className="shrink-0 text-slate-500">{currencyValue(row[field], currency)}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-orange-500 transition-all duration-500" style={{ width: `${Number(row[field]) / max * 100}%` }} /></div></div>)}</div> : <p className="py-14 text-center text-xs font-semibold text-slate-400">No data for these filters.</p>}</div>
}
