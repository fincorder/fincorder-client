import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Archive, CalendarDays, Check, ChevronDown, Edit3, Filter, ListFilter, Loader2, Plus, Search, X } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { ApiError } from '../services/api/client'
import { getAccounts, getCategories, getPeople } from '../services/api/resources'
import { archiveTransaction, createManualTransaction, getTransactionsPage, updateTransaction } from '../services/api/transactions'
import type { Account, Category, Person } from '../types/resources'
import type { TransactionType } from '../types/capture'
import type { TransactionFilterDirection, TransactionFilterType, TransactionPage, TransactionPayload, TransactionRecord } from '../types/transactions'

type TransactionDraft = Omit<TransactionPayload, 'transaction_date'> & { transaction_date: string }
type DatePreset = 'all' | 'current_month' | 'month' | 'custom'
type SortBy = 'transaction_date' | 'amount' | 'created_at'
type SortOrder = 'asc' | 'desc'

const typeLabels: Record<TransactionType, string> = { expense: 'Expense', income: 'Income', transfer: 'Transfer', lend: 'Lend', borrow: 'Borrow', repayment: 'Repayment' }
const inputClass = 'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-[#0d1a2c] dark:text-slate-100'
const compactSelectClass = `${inputClass} appearance-none pr-8 text-xs`

function today() { return new Date().toISOString().slice(0, 10) }
function dateOnly(value: string) { return value.slice(0, 10) }
function toDateTime(value: string) { return value.length === 10 ? `${value}T12:00:00Z` : value }
function monthValue() { return today().slice(0, 7) }

function monthRange(month: string) {
  if (!month) return { from: undefined, to: undefined }
  const [year, monthNumber] = month.split('-').map(Number)
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, '0')}` }
}

function emptyDraft(accounts: Account[]): TransactionDraft {
  const defaultAccount = accounts.find((account) => account.is_default) ?? accounts.find((account) => account.name.toLowerCase() === 'spending account') ?? accounts[0]
  return { account_id: defaultAccount?.id ?? '', category_id: null, person_id: null, type: 'expense', direction: 'debit', amount: '', currency: defaultAccount?.currency ?? 'INR', description: '', transaction_date: today() }
}

function draftFromTransaction(transaction: TransactionRecord): TransactionDraft {
  return { account_id: transaction.account_id, category_id: transaction.category_id, person_id: transaction.person_id, type: transaction.type, direction: transaction.direction, amount: transaction.amount, currency: transaction.currency, description: transaction.description ?? '', transaction_date: dateOnly(transaction.transaction_date) }
}

function transactionPayload(draft: TransactionDraft): TransactionPayload {
  return { ...draft, amount: draft.amount.trim(), description: draft.description?.trim() || null, transaction_date: toDateTime(draft.transaction_date) }
}

interface TransactionFieldsProps { draft: TransactionDraft; setDraft: (next: TransactionDraft) => void; accounts: Account[]; categories: Category[]; people: Person[] }

function TransactionFields({ draft, setDraft, accounts, categories, people }: TransactionFieldsProps) {
  function update<K extends keyof TransactionDraft>(field: K, value: TransactionDraft[K]) { setDraft({ ...draft, [field]: value }) }
  const categoryType = draft.type === 'income' ? 'income' : 'expense'
  const availableCategories = categories.filter((category) => category.type === categoryType)
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Amount<input required min="0.01" step="0.01" type="number" value={draft.amount} onChange={(event) => update('amount', event.target.value)} placeholder="0.00" className={`${inputClass} mt-1`} /></label>
    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Currency<input required maxLength={3} value={draft.currency} onChange={(event) => update('currency', event.target.value.toUpperCase())} className={`${inputClass} mt-1`} /></label>
    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Type<div className="relative"><select value={draft.type} onChange={(event) => update('type', event.target.value as TransactionType)} className={`${compactSelectClass} mt-1`}>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-slate-400" /></div></label>
    <div><p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Direction</p><div className="mt-1 grid h-10 grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-[#0d1a2c]"><button type="button" onClick={() => update('direction', 'debit')} className={['rounded-lg text-xs font-black transition', draft.direction === 'debit' ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300' : 'text-slate-400'].join(' ')}>Debit</button><button type="button" onClick={() => update('direction', 'credit')} className={['rounded-lg text-xs font-black transition', draft.direction === 'credit' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' : 'text-slate-400'].join(' ')}>Credit</button></div></div>
    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Account<div className="relative"><select required value={draft.account_id} onChange={(event) => { const account = accounts.find((item) => item.id === event.target.value); setDraft({ ...draft, account_id: event.target.value, currency: account?.currency ?? draft.currency }) }} className={`${compactSelectClass} mt-1`}><option value="">Select account</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}{account.is_default ? ' · Default' : ''}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-slate-400" /></div></label>
    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Category<div className="relative"><select value={draft.category_id ?? ''} onChange={(event) => update('category_id', event.target.value || null)} className={`${compactSelectClass} mt-1`}><option value="">No category</option>{availableCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-slate-400" /></div></label>
    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Person<div className="relative"><select value={draft.person_id ?? ''} onChange={(event) => update('person_id', event.target.value || null)} className={`${compactSelectClass} mt-1`}><option value="">No person</option>{people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-slate-400" /></div></label>
    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Date<div className="relative"><CalendarDays size={14} className="pointer-events-none absolute left-3 top-1/2 mt-0.5 -translate-y-1/2 text-slate-400" /><input required type="date" value={draft.transaction_date} onChange={(event) => update('transaction_date', event.target.value)} className={`${inputClass} mt-1 pl-9`} /></div></label>
    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 sm:col-span-2 xl:col-span-4">Description<input value={draft.description ?? ''} onChange={(event) => update('description', event.target.value)} placeholder="What was this transaction for?" className={`${inputClass} mt-1`} /></label>
  </div>
}

function Dialog({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={onClose}><div role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()} className="max-h-[calc(100svh-2rem)] w-full max-w-4xl animate-message-in overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/20 dark:border-slate-700 dark:bg-[#0d1a2c] sm:p-6"><div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">ledger</p><h2 className="mt-1 text-xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">{title}</h2><p className="mt-1 text-xs font-semibold text-slate-400">{description}</p></div><button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"><X size={17} /></button></div>{children}</div></div>
}

export function TransactionsPage() {
  const [pageData, setPageData] = useState<TransactionPage>({ items: [], total: 0, limit: 25, offset: 0, has_next: false })
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [search, setSearch] = useState('')
  const [type, setType] = useState<TransactionFilterType>('all')
  const [direction, setDirection] = useState<TransactionFilterDirection>('all')
  const [accountFilter, setAccountFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [personFilter, setPersonFilter] = useState('')
  const [datePreset, setDatePreset] = useState<DatePreset>('current_month')
  const [selectedMonth, setSelectedMonth] = useState(monthValue())
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('transaction_date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [isLoading, setIsLoading] = useState(true)
  const [isResourcesLoading, setIsResourcesLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<TransactionRecord | null>(null)
  const [editTransaction, setEditTransaction] = useState<TransactionRecord | null>(null)
  const [createDraft, setCreateDraft] = useState<TransactionDraft>(() => emptyDraft([]))
  const [editDraft, setEditDraft] = useState<TransactionDraft>()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    Promise.all([getAccounts(), getCategories(), getPeople()]).then(([nextAccounts, nextCategories, nextPeople]) => { setAccounts(nextAccounts); setCategories(nextCategories); setPeople(nextPeople); setCreateDraft((current) => current.account_id ? current : emptyDraft(nextAccounts)) }).catch(showError).finally(() => setIsResourcesLoading(false))
  }, [])

  const dateRange = useMemo(() => {
    if (datePreset === 'current_month') return monthRange(monthValue())
    if (datePreset === 'month') return monthRange(selectedMonth)
    if (datePreset === 'custom') return { from: customFrom || undefined, to: customTo || undefined }
    return { from: undefined, to: undefined }
  }, [customFrom, customTo, datePreset, selectedMonth])

  useEffect(() => {
    let mounted = true
    setIsLoading(true)
    getTransactionsPage({ limit: pageSize, offset: page * pageSize, search: search.trim() || undefined, type, direction, accountId: accountFilter || undefined, categoryId: categoryFilter || undefined, personId: personFilter || undefined, dateFrom: dateRange.from, dateTo: dateRange.to, sortBy, sortOrder }).then((nextPage) => { if (mounted) setPageData(nextPage) }).catch((requestError) => { if (mounted) showError(requestError) }).finally(() => { if (mounted) setIsLoading(false) })
    return () => { mounted = false }
  }, [accountFilter, categoryFilter, dateRange.from, dateRange.to, direction, page, pageSize, personFilter, search, sortBy, sortOrder, type])

  function showError(requestError: unknown) { setError(requestError instanceof ApiError ? requestError.message : 'Something went wrong. Please try again.'); setNotice('') }
  function clearFeedback() { setError(''); setNotice('') }
  function updateFilter<T>(setter: (value: T) => void, value: T) { setter(value); setPage(0) }
  function closeModal() { if (isSaving) return; setModal(null); setEditTransaction(null); setEditDraft(undefined) }

  function openCreate() { clearFeedback(); setCreateDraft(emptyDraft(accounts)); setModal('create') }
  function openEdit(transaction: TransactionRecord) { clearFeedback(); setEditTransaction(transaction); setEditDraft(draftFromTransaction(transaction)); setModal('edit') }

  async function handleCreate(event: FormEvent) {
    event.preventDefault(); clearFeedback(); setIsSaving(true)
    try { await createManualTransaction(transactionPayload(createDraft)); setPage(0); setModal(null); setNotice('Transaction added.'); setCreateDraft(emptyDraft(accounts)) } catch (requestError) { showError(requestError) } finally { setIsSaving(false) }
  }

  async function handleUpdate(event: FormEvent) {
    event.preventDefault(); if (!editTransaction || !editDraft) return; clearFeedback(); setIsSaving(true)
    try { await updateTransaction(editTransaction.id, transactionPayload(editDraft)); setModal(null); setEditTransaction(null); setEditDraft(undefined); setNotice('Transaction updated.') } catch (requestError) { showError(requestError) } finally { setIsSaving(false) }
  }

  async function confirmArchive() {
    if (!archiveTarget) return
    setIsSaving(true); clearFeedback()
    try { await archiveTransaction(archiveTarget.id); setArchiveTarget(null); setNotice('Transaction archived.') } catch (requestError) { showError(requestError) } finally { setIsSaving(false) }
  }

  const accountMap = useMemo(() => new Map(accounts.map((account) => [account.id, account])), [accounts])
  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories])
  const personMap = useMemo(() => new Map(people.map((person) => [person.id, person])), [people])
  const firstRow = pageData.total === 0 ? 0 : pageData.offset + 1
  const lastRow = Math.min(pageData.offset + pageData.items.length, pageData.total)

  return <AppShell><section className="mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-[1500px] flex-col px-4 pb-28 sm:px-8 lg:px-12"><div className="flex flex-wrap items-end justify-between gap-4 py-6 sm:py-8"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">ledger / transactions</p><h1 className="mt-1 text-3xl font-black tracking-[-0.07em] text-slate-950 dark:text-white sm:text-4xl">Transaction history</h1><p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">A precise, searchable record of everything you have captured.</p></div><button type="button" onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-4 text-xs font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"><Plus size={15} /> New transaction</button></div>
    {error && <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</p>}{notice && <p className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">{notice}</p>}
    <div className="mb-4 space-y-2 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-[#0d1a2c] sm:p-4"><div className="flex flex-wrap items-center gap-2"><div className="relative min-w-[220px] flex-1"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => updateFilter(setSearch, event.target.value)} placeholder="Search descriptions…" className="h-9 w-full rounded-xl bg-slate-50 pl-9 pr-3 text-xs font-semibold text-slate-800 outline-none dark:bg-slate-800 dark:text-white" /></div><div className="relative"><Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><select value={datePreset} onChange={(event) => updateFilter(setDatePreset, event.target.value as DatePreset)} className="h-9 appearance-none rounded-xl bg-slate-50 pl-8 pr-8 text-xs font-bold text-slate-600 outline-none dark:bg-slate-800 dark:text-slate-200"><option value="current_month">Current month</option><option value="all">All dates</option><option value="month">Choose month</option><option value="custom">Custom range</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" /></div>{datePreset === 'month' && <input type="month" value={selectedMonth} onChange={(event) => { setSelectedMonth(event.target.value); setPage(0) }} className="h-9 rounded-xl bg-slate-50 px-3 text-xs font-bold text-slate-600 outline-none dark:bg-slate-800 dark:text-slate-200" />}{datePreset === 'custom' && <div className="flex items-center gap-2"><input type="date" value={customFrom} onChange={(event) => { setCustomFrom(event.target.value); setPage(0) }} className="h-9 rounded-xl bg-slate-50 px-2 text-xs font-bold text-slate-600 outline-none dark:bg-slate-800 dark:text-slate-200" /><span className="text-xs text-slate-400">to</span><input type="date" value={customTo} onChange={(event) => { setCustomTo(event.target.value); setPage(0) }} className="h-9 rounded-xl bg-slate-50 px-2 text-xs font-bold text-slate-600 outline-none dark:bg-slate-800 dark:text-slate-200" /></div>}</div><div className="flex flex-wrap items-center gap-2"><div className="relative"><select value={type} onChange={(event) => updateFilter(setType, event.target.value as TransactionFilterType)} className="h-9 appearance-none rounded-xl bg-slate-50 px-3 pr-8 text-xs font-bold text-slate-600 outline-none dark:bg-slate-800 dark:text-slate-200"><option value="all">All types</option>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" /></div><div className="relative"><select value={direction} onChange={(event) => updateFilter(setDirection, event.target.value as TransactionFilterDirection)} className="h-9 appearance-none rounded-xl bg-slate-50 px-3 pr-8 text-xs font-bold text-slate-600 outline-none dark:bg-slate-800 dark:text-slate-200"><option value="all">Debit + Credit</option><option value="debit">Debit</option><option value="credit">Credit</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" /></div><div className="relative"><select value={accountFilter} onChange={(event) => updateFilter(setAccountFilter, event.target.value)} className="h-9 max-w-44 appearance-none rounded-xl bg-slate-50 px-3 pr-8 text-xs font-bold text-slate-600 outline-none dark:bg-slate-800 dark:text-slate-200"><option value="">All accounts</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" /></div><div className="relative"><select value={categoryFilter} onChange={(event) => updateFilter(setCategoryFilter, event.target.value)} className="h-9 max-w-44 appearance-none rounded-xl bg-slate-50 px-3 pr-8 text-xs font-bold text-slate-600 outline-none dark:bg-slate-800 dark:text-slate-200"><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" /></div><div className="relative"><select value={personFilter} onChange={(event) => updateFilter(setPersonFilter, event.target.value)} className="h-9 max-w-44 appearance-none rounded-xl bg-slate-50 px-3 pr-8 text-xs font-bold text-slate-600 outline-none dark:bg-slate-800 dark:text-slate-200"><option value="">All people</option>{people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" /></div><div className="relative ml-auto"><ListFilter size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><select value={`${sortBy}:${sortOrder}`} onChange={(event) => { const [nextSort, nextOrder] = event.target.value.split(':') as [SortBy, SortOrder]; setSortBy(nextSort); setSortOrder(nextOrder); setPage(0) }} className="h-9 appearance-none rounded-xl bg-slate-50 pl-8 pr-8 text-xs font-bold text-slate-600 outline-none dark:bg-slate-800 dark:text-slate-200"><option value="transaction_date:desc">Newest first</option><option value="transaction_date:asc">Oldest first</option><option value="amount:desc">Highest amount</option><option value="amount:asc">Lowest amount</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" /></div></div></div>
    <div className="min-h-0 flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0d1a2c]"><div className="hidden grid-cols-[minmax(220px,1.5fr)_minmax(160px,1fr)_100px_110px_70px] gap-4 border-b border-slate-100 px-5 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:border-slate-800 md:grid"><span>Transaction</span><span>Context</span><span>Direction</span><span className="text-right">Amount</span><span /></div>{isLoading || isResourcesLoading ? <div className="flex items-center justify-center py-20"><Loader2 size={22} className="animate-spin text-orange-500" /></div> : pageData.items.length === 0 ? <div className="px-5 py-20 text-center"><p className="text-sm font-black text-slate-700 dark:text-slate-200">No transactions found</p><p className="mt-1 text-xs font-semibold text-slate-400">Try changing your filters or add a new transaction.</p></div> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{pageData.items.map((transaction) => { const account = accountMap.get(transaction.account_id); const category = categoryMap.get(transaction.category_id ?? ''); const person = personMap.get(transaction.person_id ?? ''); return <div key={transaction.id} className="grid items-center gap-3 px-4 py-3 transition hover:bg-orange-50/30 dark:hover:bg-orange-500/[0.03] md:grid-cols-[minmax(220px,1.5fr)_minmax(160px,1fr)_100px_110px_70px] md:gap-4 sm:px-5"><div className="min-w-0"><div className="flex items-center gap-2"><span className={['size-2 shrink-0 rounded-full', transaction.direction === 'credit' ? 'bg-emerald-500' : 'bg-orange-500'].join(' ')} /><p className="truncate text-sm font-black text-slate-800 dark:text-slate-100">{transaction.description || typeLabels[transaction.type]}</p></div><p className="mt-1 flex items-center gap-1.5 pl-4 text-[11px] font-semibold text-slate-400"><CalendarDays size={12} /> {dateOnly(transaction.transaction_date)} <span>·</span> {typeLabels[transaction.type]}</p></div><div className="min-w-0 pl-4 md:pl-0"><p className="truncate text-xs font-bold text-slate-600 dark:text-slate-300">{account?.name ?? 'Unknown account'}</p><p className="mt-1 truncate text-[11px] font-semibold text-slate-400">{category?.name ?? 'No category'}{person ? ` · ${person.name}` : ''}</p></div><p className={['text-xs font-black uppercase tracking-wider', transaction.direction === 'credit' ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-500 dark:text-red-300'].join(' ')}>{transaction.direction}</p><p className={['text-right text-sm font-black', transaction.direction === 'credit' ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-100'].join(' ')}>{transaction.currency === 'INR' ? '₹' : transaction.currency} {transaction.amount}</p><div className="flex justify-end gap-1"><button type="button" aria-label="Edit transaction" onClick={() => openEdit(transaction)} className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-orange-100 hover:text-orange-600 dark:hover:bg-orange-500/10 dark:hover:text-orange-300"><Edit3 size={14} /></button><button type="button" aria-label="Archive transaction" onClick={() => setArchiveTarget(transaction)} className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-300"><Archive size={14} /></button></div></div> })}</div>}</div>
    <div className="flex flex-wrap items-center justify-between gap-3 py-4"><p className="text-xs font-semibold text-slate-400">Showing {firstRow}–{lastRow} of {pageData.total}</p><div className="flex items-center gap-2"><label className="text-xs font-bold text-slate-400">Rows<select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0) }} className="ml-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-600 outline-none dark:border-slate-700 dark:bg-[#0d1a2c] dark:text-slate-200"><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select></label><button type="button" disabled={page === 0 || isLoading} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 transition hover:border-orange-300 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">Previous</button><span className="min-w-16 text-center text-xs font-black text-slate-500 dark:text-slate-300">Page {page + 1} / {Math.max(1, Math.ceil(pageData.total / pageSize))}</span><button type="button" disabled={!pageData.has_next || isLoading} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 transition hover:border-orange-300 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">Next</button></div></div>
  </section>{modal === 'create' && <Dialog title="New transaction" description="Add a transaction directly to your ledger." onClose={closeModal}><form onSubmit={(event) => void handleCreate(event)}><TransactionFields draft={createDraft} setDraft={setCreateDraft} accounts={accounts} categories={categories} people={people} /><div className="mt-5 flex justify-end"><button type="submit" disabled={isSaving || !createDraft.account_id} className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-4 text-xs font-black text-white transition hover:bg-orange-600 disabled:opacity-50">{isSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save transaction</button></div></form></Dialog>}{modal === 'edit' && editDraft && <Dialog title="Edit transaction" description="Update the details while keeping the transaction history intact." onClose={closeModal}><form onSubmit={(event) => void handleUpdate(event)}><TransactionFields draft={editDraft} setDraft={setEditDraft} accounts={accounts} categories={categories} people={people} /><div className="mt-5 flex justify-end"><button type="submit" disabled={isSaving} className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-4 text-xs font-black text-white transition hover:bg-orange-600 disabled:opacity-50">{isSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save changes</button></div></form></Dialog>}{archiveTarget && <Dialog title="Archive transaction?" description="This removes it from active history. The database record will be preserved." onClose={() => { if (!isSaving) setArchiveTarget(null) }}><div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60"><p className="text-sm font-black text-slate-800 dark:text-slate-100">{archiveTarget.description || typeLabels[archiveTarget.type]}</p><p className="mt-1 text-xs font-semibold text-slate-400">{dateOnly(archiveTarget.transaction_date)} · {archiveTarget.currency} {archiveTarget.amount}</p></div><div className="mt-5 flex justify-end gap-2"><button type="button" disabled={isSaving} onClick={() => setArchiveTarget(null)} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-600 dark:border-slate-700 dark:text-slate-300">Keep transaction</button><button type="button" disabled={isSaving} onClick={() => void confirmArchive()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-500 px-4 text-xs font-black text-white transition hover:bg-red-600 disabled:opacity-50">{isSaving ? <Loader2 size={15} className="animate-spin" /> : <Archive size={15} />} Archive</button></div></Dialog>}</AppShell>
}
