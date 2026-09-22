import { useMemo, useState } from 'react'
import { Archive, Check, MessageSquare, Pencil, Plus, Search, X } from 'lucide-react'
import type { Conversation } from '../../types/conversations'

interface ConversationSidebarProps {
  conversations: Conversation[]
  activeId?: string
  search: string
  isLoading: boolean
  isCreating: boolean
  isOpen: boolean
  onSearch: (value: string) => void
  onCreate: () => void
  onSelect: (conversationId: string) => void
  onRename: (conversationId: string, title: string) => Promise<void>
  onArchive: (conversationId: string) => void
  onClose: () => void
}

function conversationTitle(conversation: Conversation) {
  return conversation.title?.trim() || 'New Chat'
}

export function ConversationSidebar({
  conversations,
  activeId,
  search,
  isLoading,
  isCreating,
  isOpen,
  onSearch,
  onCreate,
  onSelect,
  onRename,
  onArchive,
  onClose,
}: ConversationSidebarProps) {
  const [editingId, setEditingId] = useState<string>()
  const [editingTitle, setEditingTitle] = useState('')

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return conversations
    return conversations.filter((conversation) => conversationTitle(conversation).toLowerCase().includes(query))
  }, [conversations, search])

  function startRename(conversation: Conversation) {
    setEditingId(conversation.id)
    setEditingTitle(conversationTitle(conversation))
  }

  async function finishRename() {
    if (!editingId) return
    const title = editingTitle.trim()
    if (!title) return
    try {
      await onRename(editingId, title)
      setEditingId(undefined)
      setEditingTitle('')
    } catch {
      // The parent keeps the error visible in the capture view.
    }
  }

  return (
    <>
      {isOpen && <button type="button" aria-label="Close conversations" onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden" />}
      <aside className={['z-50 flex w-[min(86vw,320px)] shrink-0 flex-col rounded-3xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-[#0d1a2c] lg:relative lg:z-auto lg:w-[280px] lg:rounded-3xl lg:shadow-sm', isOpen ? 'fixed inset-x-4 top-24 bottom-28' : 'hidden lg:flex'].join(' ')}>
        <div className="flex items-center justify-between px-2 pb-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">workspace</p>
            <h2 className="mt-1 text-sm font-black text-slate-900 dark:text-white">Your chats</h2>
          </div>
          <button type="button" aria-label="Close conversations" onClick={onClose} className="grid size-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 lg:hidden"><X size={16} /></button>
        </div>

        <button type="button" onClick={onCreate} disabled={isCreating} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-orange-500 px-3 text-xs font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
          <Plus size={15} /> {isCreating ? 'Creating…' : 'New chat'}
        </button>

        <label className="relative mt-3 block">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search chats" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:bg-[#101d31]" />
        </label>

        <div className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 [scrollbar-color:#cbd5e1_transparent] dark:[scrollbar-color:#334155_transparent]">
          {isLoading && <div className="space-y-2 px-1"><div className="h-12 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" /><div className="h-12 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" /></div>}
          {!isLoading && filteredConversations.length === 0 && <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-700"><MessageSquare size={18} className="mx-auto text-slate-300 dark:text-slate-600" /><p className="mt-2 text-xs font-bold text-slate-400">{search ? 'No chats found' : 'No chats yet'}</p><p className="mt-1 text-[10px] font-semibold leading-4 text-slate-400">{search ? 'Try another search.' : 'Start a new chat to capture transactions.'}</p></div>}
          {!isLoading && filteredConversations.map((conversation) => {
            const title = conversationTitle(conversation)
            const isActive = conversation.id === activeId
            const isEditing = conversation.id === editingId
            return <div key={conversation.id} className={['group flex items-center gap-2 rounded-2xl p-1.5 transition', isActive ? 'bg-orange-50 dark:bg-orange-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'].join(' ')}>
              <button type="button" onClick={() => onSelect(conversation.id)} className="min-w-0 flex-1 text-left" aria-current={isActive ? 'page' : undefined}>
                <span className="flex items-center gap-2 px-1.5 py-1">
                  <span className={['grid size-8 shrink-0 place-items-center rounded-xl', isActive ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'].join(' ')}><MessageSquare size={14} /></span>
                  {isEditing ? <input autoFocus value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => { if (event.key === 'Enter') void finishRename(); if (event.key === 'Escape') setEditingId(undefined) }} className="h-8 min-w-0 flex-1 rounded-lg border border-orange-300 bg-white px-2 text-xs font-bold text-slate-800 outline-none dark:border-orange-500/50 dark:bg-[#101d31] dark:text-slate-100" /> : <span className={['min-w-0 flex-1 truncate text-xs font-bold', isActive ? 'text-orange-700 dark:text-orange-300' : 'text-slate-600 dark:text-slate-300'].join(' ')}>{title}</span>}
                </span>
              </button>
              {isEditing ? <button type="button" aria-label="Save chat name" onClick={() => void finishRename()} className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500 text-white"><Check size={14} /></button> : <><button type="button" aria-label={`Rename ${title}`} onClick={() => startRename(conversation)} className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-300 opacity-0 transition hover:bg-orange-50 hover:text-orange-500 group-hover:opacity-100 focus:opacity-100 dark:text-slate-600 dark:hover:bg-orange-500/10 dark:hover:text-orange-300"><Pencil size={13} /></button><button type="button" aria-label={`Archive ${title}`} onClick={() => onArchive(conversation.id)} className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 focus:opacity-100 dark:text-slate-600 dark:hover:bg-red-500/10 dark:hover:text-red-300"><Archive size={13} /></button></>}
            </div>
          })}
        </div>
        <p className="px-2 pt-3 text-[10px] font-semibold leading-4 text-slate-400">Chats are saved to your private workspace.</p>
      </aside>
    </>
  )
}
