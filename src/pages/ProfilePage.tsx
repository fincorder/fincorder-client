import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Check, ChevronRight, ImagePlus, LogOut, Pencil, Plus, Save, Settings2, Trash2, UserRound, WalletCards, UsersRound, Tags, Moon, Sun, Star } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { CapturePreferences } from '../components/capture/CapturePreferences'
import { ApiError } from '../services/api/client'
import { createAccount, createCategory, createPerson, deleteAccount, deleteCategory, deletePerson, getAccounts, getCategories, getPeople, updateAccount, updateCategory, updatePerson } from '../services/api/resources'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import type { Account, Category, CategoryType, Person } from '../types/resources'

type Section = 'profile' | 'accounts' | 'people' | 'categories'

const inputClass = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-[#0f1d30] dark:text-slate-100'
const buttonClass = 'inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-xs font-black text-white shadow-lg shadow-orange-500/15 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60'

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">{eyebrow}</p><h1 className="mt-1 text-2xl font-black tracking-[-0.06em] text-slate-950 dark:text-white sm:text-3xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p></div>
}

function EmptyState({ label }: { label: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-center text-xs font-semibold text-slate-400 dark:border-slate-700">No {label} yet. Add your first one above.</div>
}

export function ProfilePage() {
  const { user, saveProfile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [section, setSection] = useState<Section>('profile')
  const [avatar, setAvatar] = useState(() => localStorage.getItem('fincorder_avatar') ?? '')
  const [name, setName] = useState(user?.name ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [accountName, setAccountName] = useState('')
  const [accountCurrency, setAccountCurrency] = useState('INR')
  const [accountIsDefault, setAccountIsDefault] = useState(false)
  const [personName, setPersonName] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [categoryType, setCategoryType] = useState<CategoryType>('expense')
  const [editingId, setEditingId] = useState('')
  const [editingName, setEditingName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([getAccounts(), getPeople(), getCategories()])
      .then(([nextAccounts, nextPeople, nextCategories]) => { setAccounts(nextAccounts); setPeople(nextPeople); setCategories(nextCategories) })
      .catch(showError)
  }, [])

  const email = user?.email ?? 'Your account email'
  const avatarLabel = initials(user?.name ?? 'Fincorder')

  function showError(requestError: unknown) {
    setError(requestError instanceof ApiError ? requestError.message : 'Something went wrong. Please try again.')
    setNotice('')
  }

  function clearFeedback() { setError(''); setNotice('') }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { const value = String(reader.result); localStorage.setItem('fincorder_avatar', value); setAvatar(value) }
    reader.readAsDataURL(file)
  }

  async function handleProfileSave(event: FormEvent) {
    event.preventDefault(); clearFeedback(); setIsSaving(true)
    try { await saveProfile(name.trim()); setNotice('Profile updated successfully.') } catch (requestError) { showError(requestError) } finally { setIsSaving(false) }
  }

  async function handleAccountSubmit(event: FormEvent) {
    event.preventDefault(); if (!accountName.trim()) return
    clearFeedback()
    try { const account = await createAccount(accountName.trim(), accountCurrency, accountIsDefault); setAccounts((current) => account.is_default ? [...current.map((item) => ({ ...item, is_default: false })), account] : [...current, account]); setAccountName(''); setAccountIsDefault(false); setNotice('Account added.') } catch (requestError) { showError(requestError) }
  }

  async function handlePersonSubmit(event: FormEvent) {
    event.preventDefault(); if (!personName.trim()) return
    clearFeedback()
    try { const person = await createPerson(personName.trim()); setPeople((current) => [...current, person]); setPersonName(''); setNotice('Person added.') } catch (requestError) { showError(requestError) }
  }

  async function handleCategorySubmit(event: FormEvent) {
    event.preventDefault(); if (!categoryName.trim()) return
    clearFeedback()
    try { const category = await createCategory(categoryName.trim(), categoryType); setCategories((current) => [...current, category]); setCategoryName(''); setNotice('Category added.') } catch (requestError) { showError(requestError) }
  }

  async function removeResource(kind: 'account' | 'person' | 'category', id: string) {
    if (!window.confirm('Remove this item from your workspace?')) return
    clearFeedback()
    try {
      if (kind === 'account') { await deleteAccount(id); setAccounts((current) => current.filter((item) => item.id !== id)) }
      if (kind === 'person') { await deletePerson(id); setPeople((current) => current.filter((item) => item.id !== id)) }
      if (kind === 'category') { await deleteCategory(id); setCategories((current) => current.filter((item) => item.id !== id)) }
      setNotice('Removed successfully.')
    } catch (requestError) { showError(requestError) }
  }

  async function saveResource(kind: 'account' | 'person' | 'category', id: string) {
    if (!editingName.trim()) return
    clearFeedback()
    try {
      if (kind === 'account') { const updated = await updateAccount(id, { name: editingName.trim() }); setAccounts((current) => current.map((item) => item.id === id ? updated : item)) }
      if (kind === 'person') { const updated = await updatePerson(id, editingName.trim()); setPeople((current) => current.map((item) => item.id === id ? updated : item)) }
      if (kind === 'category') { const updated = await updateCategory(id, editingName.trim()); setCategories((current) => current.map((item) => item.id === id ? updated : item)) }
      setEditingId(''); setEditingName(''); setNotice('Changes saved.')
    } catch (requestError) { showError(requestError) }
  }

  function startEditing(kind: string, id: string, value: string) { setEditingId(`${kind}:${id}`); setEditingName(value); clearFeedback() }

  async function makeDefaultAccount(id: string) {
    clearFeedback()
    try {
      const updated = await updateAccount(id, { is_default: true })
      setAccounts((current) => current.map((item) => item.id === updated.id ? updated : { ...item, is_default: false }))
      setNotice(`${updated.name} is now your default account.`)
    } catch (requestError) { showError(requestError) }
  }

  function renderResourceRows<T extends { id: string; name: string }>(items: T[], kind: 'account' | 'person' | 'category', emptyLabel: string, detail: (item: T) => string) {
    if (items.length === 0) return <EmptyState label={emptyLabel} />
    return <div className="divide-y divide-slate-100 dark:divide-slate-800">{items.map((item) => { const key = `${kind}:${item.id}`; const account = kind === 'account' ? item as T & { is_default?: boolean } : null; return <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-300">{kind === 'account' ? <WalletCards size={16} /> : kind === 'person' ? <UsersRound size={16} /> : <Tags size={16} />}</div><div className="min-w-0 flex-1">{editingId === key ? <input autoFocus className={inputClass} value={editingName} onChange={(event) => setEditingName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void saveResource(kind, item.id); if (event.key === 'Escape') setEditingId('') }} /> : <><p className="truncate text-sm font-black text-slate-800 dark:text-slate-100">{item.name} {account?.is_default && <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-black text-orange-500"><Star size={11} fill="currentColor" /> Default</span>}</p><p className="text-[11px] font-semibold text-slate-400">{detail(item)}</p></>}</div>{kind === 'account' && !account?.is_default && <button type="button" aria-label={`Set ${item.name} as default`} onClick={() => void makeDefaultAccount(item.id)} className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-orange-50 hover:text-orange-500 dark:hover:bg-orange-500/10"><Star size={15} /></button>}{editingId === key ? <button type="button" aria-label="Save change" onClick={() => void saveResource(kind, item.id)} className="grid size-9 place-items-center rounded-xl bg-emerald-500 text-white"><Check size={16} /></button> : <button type="button" aria-label={`Edit ${item.name}`} onClick={() => startEditing(kind, item.id, item.name)} className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-orange-50 hover:text-orange-500 dark:hover:bg-orange-500/10"><Pencil size={15} /></button>}<button type="button" aria-label={`Delete ${item.name}`} onClick={() => void removeResource(kind, item.id)} className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"><Trash2 size={15} /></button></div>})}</div>
  }

  const navSections: { id: Section; label: string; description: string; icon: typeof UserRound }[] = [
    { id: 'profile', label: 'Profile', description: 'Your identity and preferences', icon: UserRound },
    { id: 'accounts', label: 'Accounts', description: 'Where your money lives', icon: WalletCards },
    { id: 'people', label: 'People', description: 'Lending and shared expenses', icon: UsersRound },
    { id: 'categories', label: 'Categories', description: 'Organize your transactions', icon: Tags },
  ]

  return <AppShell><section className="mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-6xl flex-col px-4 pb-28 sm:px-8 lg:px-12"><div className="py-6 sm:py-8"><SectionHeader eyebrow="settings" title="Your profile, your rules." description="Manage your identity, preferences, and the financial context Fincorder uses while recording transactions." /></div><div className="grid flex-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)]"><aside className="h-fit rounded-3xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-[#0d1a2c]">{navSections.map(({ id, label, description: itemDescription, icon: Icon }) => <button key={id} type="button" onClick={() => { setSection(id); clearFeedback() }} className={['flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition', section === id ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'].join(' ')}><span className="grid size-9 place-items-center rounded-xl bg-current/10"><Icon size={17} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-black">{label}</span><span className="mt-0.5 block truncate text-[10px] font-semibold opacity-70">{itemDescription}</span></span><ChevronRight size={15} className="opacity-50" /></button>)}</aside><div className="min-w-0 space-y-5"><div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0d1a2c] sm:p-5"><div className="flex items-center gap-3"><div className="grid size-12 place-items-center overflow-hidden rounded-2xl bg-orange-100 text-sm font-black text-orange-600 dark:bg-orange-500/15 dark:text-orange-300">{avatar ? <img src={avatar} alt="Profile" className="size-full object-cover" /> : avatarLabel}</div><div><p className="text-sm font-black text-slate-900 dark:text-white">{user?.name}</p><p className="mt-0.5 text-xs font-semibold text-slate-400">{email}</p></div></div><button type="button" onClick={() => void signOut()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-500 transition hover:border-red-200 hover:text-red-500 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-500/30 dark:hover:text-red-300"><LogOut size={15} /> <span className="hidden sm:inline">Sign out</span></button></div>{error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</p>}{notice && <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">{notice}</p>}{section === 'profile' && <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]"><form onSubmit={handleProfileSave} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0d1a2c] sm:p-6"><div className="mb-6 flex items-center justify-between"><div><p className="text-sm font-black text-slate-900 dark:text-white">Personal details</p><p className="mt-1 text-xs font-semibold text-slate-400">Keep your workspace identity up to date.</p></div><Settings2 size={19} className="text-orange-500" /></div><div className="mb-6 flex items-center gap-4"><div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-3xl bg-orange-100 text-xl font-black text-orange-600 dark:bg-orange-500/15 dark:text-orange-300">{avatar ? <img src={avatar} alt="Profile" className="size-full object-cover" /> : avatarLabel}</div><input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} /><button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-600 transition hover:border-orange-300 hover:text-orange-500 dark:border-slate-700 dark:text-slate-300"><ImagePlus size={15} /> Choose photo</button></div><label className="mb-2 block text-xs font-black text-slate-500 dark:text-slate-300" htmlFor="profile-name">Display name</label><input id="profile-name" className={inputClass} value={name} onChange={(event) => setName(event.target.value)} required minLength={1} maxLength={100} /><label className="mb-2 mt-5 block text-xs font-black text-slate-500 dark:text-slate-300" htmlFor="profile-email">Email address</label><input id="profile-email" className={`${inputClass} cursor-not-allowed opacity-60`} value={email} readOnly /><button type="submit" disabled={isSaving || name.trim() === user?.name} className={`${buttonClass} mt-6`}>{isSaving ? 'Saving…' : <><Save size={15} /> Save changes</>}</button></form><div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0d1a2c] sm:p-6"><p className="text-sm font-black text-slate-900 dark:text-white">Preferences</p><p className="mt-1 text-xs font-semibold text-slate-400">Make Fincorder feel like yours.</p><button type="button" onClick={toggleTheme} className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-slate-200 p-3 text-left transition hover:border-orange-300 dark:border-slate-700 dark:hover:border-orange-500/50"><span className="grid size-9 place-items-center rounded-xl bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-300">{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</span><span className="flex-1"><span className="block text-xs font-black text-slate-800 dark:text-slate-100">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span><span className="mt-0.5 block text-[10px] font-semibold text-slate-400">Switch appearance</span></span><span className="text-[10px] font-black uppercase tracking-wider text-orange-500">Change</span></button><CapturePreferences /><div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Workspace status</p><p className="mt-2 text-sm font-black text-slate-800 dark:text-slate-100">Personal workspace</p><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Your entries are private and tied to this account.</p></div></div></div>}{section === 'accounts' && <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0d1a2c] sm:p-6"><SectionHeader eyebrow="settings / accounts" title="Accounts" description="Add the places you spend, save, and receive money." /><form onSubmit={handleAccountSubmit} className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px_auto]"><input className={inputClass} placeholder="e.g. HDFC account" value={accountName} onChange={(event) => setAccountName(event.target.value)} /><input className={inputClass} maxLength={3} value={accountCurrency} onChange={(event) => setAccountCurrency(event.target.value.toUpperCase())} /><button className={buttonClass} type="submit"><Plus size={15} /> Add</button></form><div className="mt-7">{renderResourceRows(accounts, 'account', 'accounts', (item) => `${item.currency} · ${item.is_active ? 'Active' : 'Inactive'}`)}</div></div>}{section === 'people' && <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0d1a2c] sm:p-6"><SectionHeader eyebrow="settings / people" title="People" description="Keep track of people connected to lending, borrowing, and shared expenses." /><form onSubmit={handlePersonSubmit} className="mt-6 flex gap-3"><input className={inputClass} placeholder="e.g. Ahmed" value={personName} onChange={(event) => setPersonName(event.target.value)} /><button className={buttonClass} type="submit"><Plus size={15} /> Add</button></form><div className="mt-7">{renderResourceRows(people, 'person', 'people', () => 'Available for conversational capture')}</div></div>}{section === 'categories' && <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0d1a2c] sm:p-6"><SectionHeader eyebrow="settings / categories" title="Categories" description="Tune the labels Fincorder uses when it understands your transactions." /><form onSubmit={handleCategorySubmit} className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_auto]"><input className={inputClass} placeholder="e.g. Subscriptions" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} /><select className={inputClass} value={categoryType} onChange={(event) => setCategoryType(event.target.value as CategoryType)}><option value="expense">Expense</option><option value="income">Income</option></select><button className={buttonClass} type="submit"><Plus size={15} /> Add</button></form><div className="mt-7">{renderResourceRows(categories, 'category', 'categories', (item) => item.type === 'expense' ? 'Expense category' : 'Income category')}</div></div>}</div></div></section></AppShell>
}
