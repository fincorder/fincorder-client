import { Check, ChevronDown, Loader2, Pencil, Plus, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../services/api/client'
import { createAccount, createCategory, createPerson, getAccounts, getCategories, getPeople } from '../../services/api/resources'
import type { Account, Category, Person } from '../../types/resources'
import type { TransactionProposal, TransactionType } from '../../types/capture'

interface TransactionProposalCardProps {
  transactions: TransactionProposal[]
  onConfirm: (transactions: TransactionProposal[]) => void
  onReject: () => void
  isSubmitting?: boolean
}

interface EntityComboboxProps {
  label: string
  value: string | null
  options: string[]
  placeholder: string
  onChange: (value: string | null) => void
  onCreate?: (name: string) => Promise<string>
}

const typeLabels: Record<TransactionType, string> = {
  expense: 'Expense', income: 'Income', transfer: 'Transfer', lend: 'Lend', borrow: 'Borrow', repayment: 'Repayment',
}

const inputClass = 'mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-[#0d1a2c] dark:text-slate-100'

function displayValue(value: string | number | null | undefined) {
  return value === null || value === undefined || value === '' ? 'Not specified' : String(value)
}

function dateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : ''
}

function EntityCombobox({ label, value, options, placeholder, onChange, onCreate }: EntityComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState(value ?? '')
  const [isCreating, setIsCreating] = useState(false)
  const [creationError, setCreationError] = useState('')

  useEffect(() => setQuery(value ?? ''), [value])

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return options.filter((option) => option.toLowerCase().includes(normalizedQuery)).slice(0, 8)
  }, [options, query])
  const hasExactMatch = options.some((option) => option.toLowerCase() === query.trim().toLowerCase())
  const canAdd = Boolean(onCreate && query.trim() && !hasExactMatch)

  function choose(option: string) {
    setQuery(option)
    onChange(option)
    setIsOpen(false)
  }

  async function addOption() {
    if (!onCreate || !query.trim()) return
    setIsCreating(true)
    setCreationError('')
    try {
      const createdName = await onCreate(query.trim())
      choose(createdName)
    } catch (error) {
      setCreationError(error instanceof ApiError ? error.message : 'Could not add this option.')
    } finally {
      setIsCreating(false)
    }
  }

  return <div className="relative">
    <label className="text-xs font-black text-slate-500 dark:text-slate-400">{label}</label>
    <div className="relative">
      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input value={query} placeholder={placeholder} onFocus={() => setIsOpen(true)} onChange={(event) => { setQuery(event.target.value); onChange(event.target.value || null); setIsOpen(true) }} className={`${inputClass} pl-9 pr-9`} />
      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
    {isOpen && <>
      <button type="button" aria-label="Close options" className="fixed inset-0 z-10 cursor-default" onClick={() => setIsOpen(false)} />
      <div className="absolute left-0 right-0 top-[4.35rem] z-20 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/10 dark:border-slate-700 dark:bg-[#101d31]">
        {filteredOptions.map((option) => <button key={option} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => choose(option)} className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-orange-50 hover:text-orange-600 dark:text-slate-200 dark:hover:bg-orange-500/10 dark:hover:text-orange-300">{option}</button>)}
        {canAdd && <button type="button" disabled={isCreating} onMouseDown={(event) => event.preventDefault()} onClick={() => void addOption()} className="flex w-full items-center gap-2 rounded-lg border-t border-slate-100 px-3 py-2.5 text-left text-xs font-black text-orange-600 transition hover:bg-orange-50 disabled:opacity-50 dark:border-slate-800 dark:text-orange-300 dark:hover:bg-orange-500/10"><span className="grid size-5 place-items-center rounded-md bg-orange-100 dark:bg-orange-500/15">{isCreating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}</span>Add “{query.trim()}”</button>}
        {!filteredOptions.length && !canAdd && <p className="px-3 py-2 text-xs font-semibold text-slate-400">No matching options.</p>}
        {creationError && <p className="px-3 py-2 text-xs font-bold text-red-500">{creationError}</p>}
      </div>
    </>}
  </div>
}

export function TransactionProposalCard({ transactions, onConfirm, onReject, isSubmitting = false }: TransactionProposalCardProps) {
  const [drafts, setDrafts] = useState(transactions)
  const [isEditing, setIsEditing] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [isLoadingResources, setIsLoadingResources] = useState(false)
  const [resourceError, setResourceError] = useState('')
  const [isResourceSaving, setIsResourceSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    setIsLoadingResources(true)
    Promise.all([getAccounts(), getCategories(), getPeople()])
      .then(([nextAccounts, nextCategories, nextPeople]) => { if (mounted) { setAccounts(nextAccounts); setCategories(nextCategories); setPeople(nextPeople) } })
      .catch((requestError) => { if (mounted) setResourceError(requestError instanceof ApiError ? requestError.message : 'Could not load your options.') })
      .finally(() => { if (mounted) setIsLoadingResources(false) })
    return () => { mounted = false }
  }, [])

  function update(index: number, field: keyof TransactionProposal, value: string | null) {
    setDrafts((current) => current.map((transaction, transactionIndex) => transactionIndex === index ? {
      ...transaction,
      [field]: field === 'amount' ? (value === '' ? null : value) : (value || null),
    } : transaction))
  }

  async function addAccount(name: string, currency = 'INR') {
    setIsResourceSaving(true)
    try { const created = await createAccount(name, currency); setAccounts((current) => [...current, created]); return created.name } finally { setIsResourceSaving(false) }
  }

  async function addCategory(name: string, type: 'expense' | 'income') {
    setIsResourceSaving(true)
    try { const created = await createCategory(name, type); setCategories((current) => [...current, created]); return created.name } finally { setIsResourceSaving(false) }
  }

  async function addPerson(name: string) {
    setIsResourceSaving(true)
    try { const created = await createPerson(name); setPeople((current) => [...current, created]); return created.name } finally { setIsResourceSaving(false) }
  }

  function renderEditor(transaction: TransactionProposal, index: number) {
    const categoryType = transaction.type === 'income' ? 'income' : 'expense'
    return <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-black text-slate-500 dark:text-slate-400">Amount<input value={transaction.amount ?? ''} onChange={(event) => update(index, 'amount', event.target.value)} inputMode="decimal" placeholder="0.00" className={inputClass} /></label>
      <label className="text-xs font-black text-slate-500 dark:text-slate-400">Currency<input value={transaction.currency} onChange={(event) => update(index, 'currency', event.target.value.toUpperCase())} maxLength={3} className={inputClass} /></label>
      <label className="text-xs font-black text-slate-500 dark:text-slate-400">Type<select value={transaction.type ?? ''} onChange={(event) => update(index, 'type', event.target.value || null)} className={inputClass}><option value="">Select type</option>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <div><p className="text-xs font-black text-slate-500 dark:text-slate-400">Direction</p><div className="mt-1 grid h-10 grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-[#0d1a2c]"><button type="button" onClick={() => update(index, 'direction', 'debit')} className={['rounded-lg text-xs font-black transition', transaction.direction === 'debit' ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'].join(' ')}>Debit</button><button type="button" onClick={() => update(index, 'direction', 'credit')} className={['rounded-lg text-xs font-black transition', transaction.direction === 'credit' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'].join(' ')}>Credit</button></div></div>
      <EntityCombobox label="Account" value={transaction.account} options={accounts.map((item) => item.name)} placeholder={isLoadingResources ? 'Loading accounts…' : 'Search or add account'} onChange={(value) => update(index, 'account', value)} onCreate={(name) => addAccount(name, transaction.currency || 'INR')} />
      <EntityCombobox label="Category" value={transaction.category} options={categories.filter((item) => item.type === categoryType).map((item) => item.name)} placeholder={isLoadingResources ? 'Loading categories…' : 'Search or add category'} onChange={(value) => update(index, 'category', value)} onCreate={(name) => addCategory(name, categoryType)} />
      <EntityCombobox label="Person" value={transaction.person} options={people.map((item) => item.name)} placeholder={isLoadingResources ? 'Loading people…' : 'Search or add person'} onChange={(value) => update(index, 'person', value)} onCreate={addPerson} />
      <label className="text-xs font-black text-slate-500 dark:text-slate-400">Date<input type="date" value={dateInputValue(transaction.transaction_date)} onChange={(event) => update(index, 'transaction_date', event.target.value || null)} className={inputClass} /></label>
      <label className="text-xs font-black text-slate-500 dark:text-slate-400 sm:col-span-2">Description<input value={transaction.description ?? ''} onChange={(event) => update(index, 'description', event.target.value)} placeholder="What was this for?" className={inputClass} /></label>
    </div>
  }

  return <div className="mt-3 w-full max-w-[min(94%,42rem)] overflow-visible rounded-2xl border border-orange-200 bg-white shadow-lg shadow-orange-950/5 dark:border-orange-500/30 dark:bg-[#101d31]">
    <div className="flex items-center justify-between rounded-t-2xl border-b border-orange-100 bg-orange-50/70 px-4 py-3 dark:border-orange-500/15 dark:bg-orange-500/10">
      <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-600 dark:text-orange-300">Review transaction</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Nothing is saved until you confirm.</p></div>
      <button type="button" onClick={() => setIsEditing((current) => !current)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-black text-orange-600 transition hover:bg-orange-100 dark:text-orange-300 dark:hover:bg-orange-500/15"><Pencil size={13} /> {isEditing ? 'View summary' : 'Edit details'}</button>
    </div>

    <div className="space-y-4 p-4">
      {resourceError && isEditing && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{resourceError}</p>}
      {drafts.map((transaction, index) => <div key={`${transaction.transaction_id ?? 'new'}-${index}`} className="space-y-3">
        {drafts.length > 1 && <p className="text-xs font-black uppercase tracking-wider text-slate-400">Transaction {index + 1}</p>}
        {isEditing ? renderEditor(transaction, index) : <div className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm sm:grid-cols-4">
          <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Amount</p><p className="mt-1 font-black text-slate-900 dark:text-white">{transaction.currency === 'INR' ? '₹' : transaction.currency} {displayValue(transaction.amount)}</p></div>
          <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Type</p><p className="mt-1 text-slate-700 dark:text-slate-200">{transaction.type ? typeLabels[transaction.type] : 'Not specified'}</p></div>
          <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Direction</p><p className={['mt-1 font-black', transaction.direction === 'credit' ? 'text-emerald-600 dark:text-emerald-300' : transaction.direction === 'debit' ? 'text-red-600 dark:text-red-300' : 'text-slate-500'].join(' ')}>{transaction.direction === 'credit' ? 'Credit' : transaction.direction === 'debit' ? 'Debit' : 'Not specified'}</p></div>
          <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Date</p><p className="mt-1 text-slate-700 dark:text-slate-200">{displayValue(dateInputValue(transaction.transaction_date))}</p></div>
          <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Account</p><p className="mt-1 text-slate-700 dark:text-slate-200">{displayValue(transaction.account)}</p></div>
          <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Category</p><p className="mt-1 text-slate-700 dark:text-slate-200">{displayValue(transaction.category)}</p></div>
          <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Person</p><p className="mt-1 text-slate-700 dark:text-slate-200">{displayValue(transaction.person)}</p></div>
          <div className="col-span-2 sm:col-span-1"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Description</p><p className="mt-1 truncate text-slate-700 dark:text-slate-200">{displayValue(transaction.description)}</p></div>
        </div>}
        {index < drafts.length - 1 && <div className="border-t border-slate-100 dark:border-slate-800" />}
      </div>)}
    </div>

    <div className="flex gap-2 rounded-b-2xl border-t border-slate-100 p-3 dark:border-slate-800">
      <button type="button" disabled={isSubmitting || isResourceSaving} onClick={onReject} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-black text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-500/30 dark:hover:bg-red-500/10"><X size={14} /> Reject</button>
      <button type="button" disabled={isSubmitting || isResourceSaving} onClick={() => onConfirm(drafts)} className="inline-flex flex-[1.5] items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-3 py-2.5 text-xs font-black text-white transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-60">{isSubmitting ? 'Saving…' : isResourceSaving ? 'Adding option…' : <><Check size={14} /> {drafts.some((item) => item.operation === 'update') ? 'Apply changes' : 'Add transaction'}</>}</button>
    </div>
  </div>
}
