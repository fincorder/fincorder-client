import type { ReactNode } from 'react'
import { Code2, Sparkles } from 'lucide-react'
import { BrandMark } from '../brand/BrandMark'
import { ThemeToggle } from '../ui/ThemeToggle'

interface AuthShellProps { children: ReactNode; eyebrow: string; title: string; description: string }

export function AuthShell({ children, eyebrow, title, description }: AuthShellProps) {
  return (
    <main className="min-h-screen w-full bg-white text-slate-900 transition-colors dark:bg-[#08111f] dark:text-white">
      <div className="grid min-h-screen w-full lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <section className="relative hidden min-h-screen overflow-hidden bg-[#fff7ed] p-8 dark:bg-[#101b2e] sm:p-10 lg:flex lg:flex-col lg:justify-between 2xl:p-16 min-[1920px]:p-20">
          <div className="absolute -right-32 -top-32 size-96 rounded-full bg-orange-200/40 blur-3xl dark:bg-orange-500/10" />
          <div className="absolute -bottom-40 -left-28 size-96 rounded-full bg-orange-300/30 blur-3xl dark:bg-blue-500/10" />
          <BrandMark />
          <div className="relative max-w-2xl pb-8">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-orange-700 dark:border-orange-500/20 dark:bg-slate-900/50 dark:text-orange-300"><Sparkles size={13} /> personal finance, rethought</div>
            <h1 className="max-w-3xl text-[clamp(3rem,4.2vw,7rem)] font-bold leading-[1.05] tracking-[-0.08em] text-slate-950 dark:text-white">Your money,<br /><span className="text-orange-500">in context.</span></h1>
            <p className="mt-7 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300 2xl:text-base 2xl:leading-8">Capture the way you naturally think. Fincorder turns everyday money moments into a clear, living record.</p>
            <div className="mt-10 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 2xl:text-sm"><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-950 text-orange-400 dark:bg-orange-500 dark:text-white"><Code2 size={16} /></div><span>built for clarity, one transaction at a time</span></div>
          </div>
          <p className="relative text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">fincorder / workspace</p>
        </section>
        <section className="flex min-h-screen w-full flex-col px-5 py-6 sm:px-10 lg:px-14 xl:px-20 2xl:px-28 min-[1920px]:px-40">
          <header className="flex items-center justify-between lg:justify-end"><div className="lg:hidden"><BrandMark /></div><ThemeToggle /></header>
          <div className="flex flex-1 items-center justify-center py-12"><div className="w-full max-w-xl"><div className="mb-9"><p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-orange-500">{eyebrow}</p><h2 className="text-[clamp(2rem,3vw,4rem)] font-bold leading-tight tracking-[-0.07em] text-slate-950 dark:text-white">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400 2xl:text-base 2xl:leading-7">{description}</p></div>{children}</div></div>
          <p className="text-center text-[11px] leading-5 text-slate-400">By continuing, you agree to keep your financial workspace secure.</p>
        </section>
      </div>
    </main>
  )
}

