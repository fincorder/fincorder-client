import { ArrowLeft, Construction } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'

export function ComingSoonPage() {
  const location = useLocation()
  const label = location.pathname.split('/').pop()?.replace(/-/g, ' ') ?? 'this area'
  return <AppShell><section className="flex min-h-[calc(100svh-5rem)] items-center justify-center px-6 pb-28"><div className="max-w-md text-center"><div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-orange-100 text-orange-500 dark:bg-orange-500/15 dark:text-orange-300"><Construction size={28} /></div><p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-500">coming next</p><h1 className="mt-3 text-3xl font-bold capitalize tracking-[-0.07em] text-slate-950 dark:text-white">{label}</h1><p className="mt-4 text-sm leading-7 text-slate-500 dark:text-slate-400">The capture workspace is ready first. This section will be connected to the Fincorder API next.</p><Link to="/app" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"><ArrowLeft size={16} /> Back to capture</Link></div></section></AppShell>
}
