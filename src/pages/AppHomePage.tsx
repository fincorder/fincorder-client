import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BrandMark } from '../components/brand/BrandMark'
import { ThemeToggle } from '../components/ui/ThemeToggle'

export function AppHomePage() {
  return (
    <main className="min-h-screen w-full bg-white px-5 py-6 text-slate-900 dark:bg-[#08111f] dark:text-white sm:px-10 2xl:px-16">
      <header className="flex w-full items-center justify-between"><BrandMark /><ThemeToggle /></header>
      <section className="mx-auto flex min-h-[75vh] w-full max-w-3xl flex-col items-center justify-center text-center"><div className="mb-6 grid size-16 place-items-center rounded-2xl bg-orange-500 text-white shadow-xl shadow-orange-500/20"><CheckCircle2 size={30} /></div><p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-orange-500">workspace ready</p><h1 className="text-[clamp(2.25rem,4vw,5rem)] font-bold leading-tight tracking-[-0.08em]">Your financial workspace starts here.</h1><p className="mt-5 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400 2xl:text-base">Authentication is connected. The capture workspace is the next layer of Fincorder.</p><Link to="/login" className="mt-8 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-orange-300 hover:text-orange-500 dark:border-slate-700 dark:text-slate-200"><ArrowRight size={16} /> Back to sign in</Link></section>
    </main>
  )
}
