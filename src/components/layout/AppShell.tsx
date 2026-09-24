import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { BarChart3, CheckCheck, List, MessageCircle, UserRound } from 'lucide-react'
import { BrandMark } from '../brand/BrandMark'
import { AVATAR_KEY, useAuth } from '../../context/AuthContext'

interface AppShellProps { children: ReactNode }

export function AppShell({ children }: AppShellProps) {
  const { user } = useAuth()
  const initials = user?.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() ?? 'FC'
  const avatar = localStorage.getItem(AVATAR_KEY)

  return (
    <main className="min-h-screen w-full bg-[#fffdfa] text-slate-900 dark:bg-[#08111f] dark:text-white">
      <div className="mx-auto flex min-h-screen w-full flex-col">
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200/80 px-5 sm:px-8 lg:px-12 dark:border-slate-800/80">
          <BrandMark />
          <span className="hidden text-xs font-semibold text-slate-400 sm:inline">personal workspace</span>
        </header>
        <div className="min-h-0 flex-1">{children}</div>
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/90 bg-white/90 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl dark:border-slate-800/90 dark:bg-[#0b1728]/90 sm:px-8">
          <div className="mx-auto grid w-full max-w-4xl grid-cols-5 items-end gap-1">
            <NavLink to="/app/reports" className={({ isActive }) => ['group flex flex-col items-center gap-1.5 text-[10px] font-bold tracking-wide transition', isActive ? 'text-orange-500' : 'text-slate-400 hover:text-orange-500 dark:text-slate-500 dark:hover:text-orange-400'].join(' ')}>
              <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-500 transition group-hover:-translate-y-0.5 dark:bg-slate-800 dark:text-slate-300"><BarChart3 size={18} /></span>
              <span>Reports</span>
            </NavLink>
            <NavLink to="/app/transactions" className={({ isActive }) => ['group flex flex-col items-center gap-1.5 text-[10px] font-bold tracking-wide transition', isActive ? 'text-orange-500' : 'text-slate-400 hover:text-orange-500 dark:text-slate-500 dark:hover:text-orange-400'].join(' ')}>
              <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-500 transition group-hover:-translate-y-0.5 dark:bg-slate-800 dark:text-slate-300"><List size={18} /></span>
              <span>Transactions</span>
            </NavLink>
            <NavLink to="/app" className={({ isActive }) => ['group flex flex-col items-center gap-1.5 text-[10px] font-bold tracking-wide transition', '-mt-7', isActive ? 'text-orange-500' : 'text-slate-400 hover:text-orange-500 dark:text-slate-500 dark:hover:text-orange-400'].join(' ')}>
              <span className="grid size-14 place-items-center rounded-2xl bg-orange-500 text-white shadow-xl shadow-orange-500/30 transition group-hover:-translate-y-0.5"><MessageCircle size={23} strokeWidth={2.2} /></span>
              <span>Capture</span>
            </NavLink>
            <NavLink to="/app/review" className={({ isActive }) => ['group flex flex-col items-center gap-1.5 text-[10px] font-bold tracking-wide transition', isActive ? 'text-orange-500' : 'text-slate-400 hover:text-orange-500 dark:text-slate-500 dark:hover:text-orange-400'].join(' ')}>
              <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-500 transition group-hover:-translate-y-0.5 dark:bg-slate-800 dark:text-slate-300"><CheckCheck size={18} /></span>
              <span>Review</span>
            </NavLink>
            <NavLink to="/app/profile" className={({ isActive }) => ['group flex flex-col items-center gap-1.5 text-[10px] font-bold tracking-wide transition', isActive ? 'text-orange-500' : 'text-slate-400 hover:text-orange-500 dark:text-slate-500 dark:hover:text-orange-400'].join(' ')}>
              <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-[10px] font-black text-slate-500 transition group-hover:-translate-y-0.5 dark:bg-slate-800 dark:text-slate-300">
                {avatar ? <img src={avatar} alt="Your profile" className="size-full rounded-xl object-cover" /> : user ? initials : <UserRound size={18} />}
              </span>
              <span>Profile</span>
            </NavLink>
          </div>
        </nav>
      </div>
    </main>
  )
}
