import { useEffect, useMemo, useState } from 'react'
import { Check, ClipboardCheck, ExternalLink, Loader2, Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { ApiError } from '../services/api/client'
import { confirmCapture, getReviewEvents, rejectCapture } from '../services/api/capture'
import type { ReviewEvent, TransactionProposal } from '../types/capture'

const PAGE_SIZE = 25

function defaultMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function amount(transaction: TransactionProposal) {
  if (transaction.amount === null || transaction.amount === undefined) return null
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: transaction.currency || 'INR', maximumFractionDigits: 2 }).format(Number(transaction.amount))
}

function transactionSummary(event: ReviewEvent) {
  const transactions = event.extracted_data?.transactions ?? []
  const first = transactions[0]
  if (!first) return event.raw_text
  if (first.operation === 'delete') return first.description || 'Archive transaction'
  const label = first.description || first.type || 'Transaction'
  const value = amount(first)
  return `${value ? `${value} · ` : ''}${label}${transactions.length > 1 ? ` + ${transactions.length - 1} more` : ''}`
}

const statusMeta: Record<ReviewEvent['status'], { label: string; className: string }> = {
  awaiting_confirmation: { label: 'Needs review', className: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300' },
  needs_clarification: { label: 'Needs details', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' },
}

export function ReviewPage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<ReviewEvent[]>([])
  const [total, setTotal] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState(defaultMonth)
  const [page, setPage] = useState(0)
  const [refresh, setRefresh] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<string>()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading(true)
      getReviewEvents({ search, month: month || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE })
        .then((response) => {
          setEvents(response.items)
          setTotal(response.total)
          setHasNext(response.has_next)
        })
        .catch((requestError) => setError(requestError instanceof ApiError ? requestError.message : 'Could not load your review queue.'))
        .finally(() => setIsLoading(false))
    }, search ? 250 : 0)
    return () => window.clearTimeout(timer)
  }, [search, month, page, refresh])

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const firstRow = total === 0 ? 0 : page * PAGE_SIZE + 1
  const lastRow = Math.min((page + 1) * PAGE_SIZE, total)
  const currentMonthLabel = useMemo(() => month ? new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(`${month}-01T00:00:00`)) : 'All months', [month])

  function openInCapture(event: ReviewEvent) {
    navigate(`/app?conversation=${event.conversation_id}&event=${event.id}`)
  }

  async function handleConfirm(event: ReviewEvent) {
    const transactions = event.extracted_data?.transactions ?? []
    if (!transactions.length) return
    setBusyId(event.id)
    setError('')
    setNotice('')
    try {
      await confirmCapture(event.id, transactions, event.revision)
      setNotice('Transaction proposal added successfully.')
      setRefresh((current) => current + 1)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Could not confirm this proposal.')
    } finally {
      setBusyId(undefined)
    }
  }

  async function handleReject(event: ReviewEvent) {
    setBusyId(event.id)
    setError('')
    setNotice('')
    try {
      await rejectCapture(event.id)
      setNotice('Proposal rejected. It remains available in the conversation history.')
      setRefresh((current) => current + 1)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Could not reject this proposal.')
    } finally {
      setBusyId(undefined)
    }
  }

  return (
    <AppShell>
      <section className="mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-[1500px] flex-col px-4 pb-28 sm:px-8 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-4 py-6 sm:py-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">review / pending work</p>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.07em] text-slate-950 dark:text-white sm:text-4xl">Review queue</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500 dark:text-slate-400">Proposals and captures that still need your attention before they become part of your ledger.</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-black text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300">
            <ClipboardCheck size={15} /> {total} pending
          </div>
        </div>

        {error && <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
        {notice && <p className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">{notice}</p>}

        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-[#0d1a2c] sm:p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0) }} placeholder="Search captures or chat names…" className="h-10 w-full rounded-xl bg-slate-50 pl-9 pr-3 text-xs font-semibold text-slate-800 outline-none transition focus:bg-white focus:ring-4 focus:ring-orange-500/10 dark:bg-slate-800 dark:text-white dark:focus:bg-[#101d31]" />
          </div>
          <label className="flex h-10 items-center gap-2 rounded-xl bg-slate-50 px-3 text-xs font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <span className="hidden sm:inline">Month</span>
            <input type="month" value={month} onChange={(event) => { setMonth(event.target.value); setPage(0) }} className="bg-transparent text-xs font-black outline-none" />
          </label>
          {month && <button type="button" onClick={() => { setMonth(''); setPage(0) }} className="inline-flex h-10 items-center gap-1 rounded-xl px-3 text-xs font-black text-slate-400 transition hover:bg-slate-100 hover:text-orange-500 dark:hover:bg-slate-800 dark:hover:text-orange-300"><X size={14} /> All months</button>}
          <span className="ml-auto hidden text-[11px] font-bold text-slate-400 sm:inline">{currentMonthLabel}</span>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0d1a2c]">
          <div className="hidden grid-cols-[minmax(220px,1.45fr)_minmax(180px,1fr)_145px_145px_220px] gap-4 border-b border-slate-100 px-5 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:border-slate-800 md:grid">
            <span>Capture</span><span>Proposal</span><span>Status</span><span>Created</span><span className="text-right">Actions</span>
          </div>
          {isLoading ? <div className="flex items-center justify-center py-24"><Loader2 size={22} className="animate-spin text-orange-500" /></div> : events.length === 0 ? <div className="px-5 py-24 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"><Check size={22} /></div><p className="mt-4 text-sm font-black text-slate-700 dark:text-slate-200">Nothing needs your attention</p><p className="mt-1 text-xs font-semibold text-slate-400">Pending proposals and clarification requests will appear here.</p></div> : <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {events.map((event) => {
              const meta = statusMeta[event.status]
              const isBusy = busyId === event.id
              return <div key={event.id} className="grid items-center gap-3 px-4 py-4 transition hover:bg-orange-50/30 dark:hover:bg-orange-500/[0.03] md:grid-cols-[minmax(220px,1.45fr)_minmax(180px,1fr)_145px_145px_220px] md:gap-4 sm:px-5">
                <div className="min-w-0"><p className="truncate text-sm font-black text-slate-800 dark:text-slate-100">{event.conversation_title || 'Untitled capture'}</p><p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-5 text-slate-400">{event.raw_text}</p></div>
                <div className="min-w-0"><p className="truncate text-xs font-black text-slate-700 dark:text-slate-200">{transactionSummary(event)}</p>{event.missing_fields?.length ? <p className="mt-1 truncate text-[11px] font-semibold text-amber-600 dark:text-amber-300">Missing: {event.missing_fields.join(', ')}</p> : <p className="mt-1 text-[11px] font-semibold text-slate-400">Revision {event.revision}</p>}</div>
                <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-black ${meta.className}`}>{meta.label}</span>
                <p className="text-[11px] font-semibold text-slate-400">{dateTime(event.created_at)}</p>
                <div className="flex flex-wrap justify-start gap-1.5 md:justify-end">
                  <button type="button" disabled={isBusy} onClick={() => openInCapture(event)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[10px] font-black text-slate-500 transition hover:border-orange-300 hover:text-orange-500 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-orange-500/50 dark:hover:text-orange-300"><ExternalLink size={12} /> {event.status === 'awaiting_confirmation' ? 'Open' : 'Resume'}</button>
                  {event.status === 'awaiting_confirmation' && <><button type="button" disabled={isBusy} onClick={() => void handleConfirm(event)} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-orange-500 px-2.5 text-[10px] font-black text-white transition hover:bg-orange-600 disabled:opacity-50">{isBusy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Add</button><button type="button" disabled={isBusy} onClick={() => void handleReject(event)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 px-2.5 text-[10px] font-black text-red-500 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-500/20 dark:hover:bg-red-500/10"><X size={12} /> Reject</button></>}
                  {event.status === 'needs_clarification' && <button type="button" disabled={isBusy} onClick={() => void handleReject(event)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 px-2.5 text-[10px] font-black text-red-500 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-500/20 dark:hover:bg-red-500/10"><X size={12} /> Reject</button>}
                </div>
              </div>
            })}
          </div>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 py-4"><p className="text-xs font-semibold text-slate-400">Showing {firstRow}–{lastRow} of {total}</p><div className="flex items-center gap-2"><button type="button" disabled={page === 0 || isLoading} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 transition hover:border-orange-300 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">Previous</button><span className="min-w-16 text-center text-xs font-black text-slate-500 dark:text-slate-300">Page {page + 1} / {pageCount}</span><button type="button" disabled={!hasNext || isLoading} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 transition hover:border-orange-300 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">Next</button></div></div>
      </section>
    </AppShell>
  )
}
