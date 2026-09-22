import { ArrowUpRight, WalletCards } from 'lucide-react'

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid size-10 place-items-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
        <WalletCards size={20} strokeWidth={2.4} />
        <ArrowUpRight className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 text-orange-500 dark:bg-slate-950" size={14} strokeWidth={3} />
      </div>
      <span className="text-lg font-bold tracking-[-0.08em] text-slate-950 dark:text-white">fincorder<span className="text-orange-500">.</span></span>
    </div>
  )
}
