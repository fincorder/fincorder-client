import type { ReportData } from '../../types/reports'
import { currencyValue } from './format'

export function CategoryComparison({ data }: { data: ReportData }) {
  if (!data.comparison) return null
  const rows = data.breakdowns.category_comparison.slice(0, 10)
  return <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0d1a2c]">
    <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800"><h3 className="text-sm font-black text-slate-900 dark:text-white">Category comparison</h3><p className="mt-1 text-[11px] font-semibold text-slate-400">Compared with {data.comparison.date_from} to {data.comparison.date_to}</p></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[540px] text-left"><thead><tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:bg-slate-800/30"><th className="px-5 py-3">Category</th><th className="px-4 py-3">This period</th><th className="px-4 py-3">Previous</th><th className="px-4 py-3">Change</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{rows.map((row) => <tr key={row.key} className="text-xs font-semibold text-slate-600 dark:text-slate-300"><td className="px-5 py-3 font-black">{row.label}</td><td className="px-4 py-3">{currencyValue(row.spending, data.currency)}</td><td className="px-4 py-3">{currencyValue(row.previous_spending, data.currency)}</td><td className={['px-4 py-3 font-black', Number(row.spending_change) > 0 ? 'text-orange-500' : 'text-emerald-600 dark:text-emerald-300'].join(' ')}>{currencyValue(row.spending_change, data.currency)}</td></tr>)}</tbody></table>{!rows.length && <p className="py-12 text-center text-xs font-semibold text-slate-400">No category spending in this period.</p>}</div>
  </section>
}
