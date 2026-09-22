import { useEffect, useMemo, useRef, useState } from 'react'
import { CircleCheck, Menu, Sparkles } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { ChatComposer } from '../components/capture/ChatComposer'
import { ConversationSidebar } from '../components/capture/ConversationSidebar'
import { MessageBubble } from '../components/capture/MessageBubble'
import { ApiError } from '../services/api/client'
import { captureTransaction, confirmCapture, getConversationFinancialEvents, getConversationMessages, rejectCapture } from '../services/api/capture'
import { archiveConversation, createConversation, getConversations, updateConversation } from '../services/api/conversations'
import type { CaptureMessage, TransactionProposal } from '../types/capture'
import type { Conversation } from '../types/conversations'

const ACTIVE_CONVERSATION_KEY = 'fincorder_active_conversation'
const WELCOME_MESSAGE: CaptureMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Hi, I\'m your financial copilot. Tell me what happened and I\'ll turn it into a transaction. Try "Spent ₹500 on petrol today."',
}

function getConversationTitle(message: string) {
  const normalized = message.trim().replace(/\s+/g, ' ')
  return normalized.length > 42 ? `${normalized.slice(0, 42).trimEnd()}…` : normalized
}

export function CapturePage() {
  const [messages, setMessages] = useState<CaptureMessage[]>([WELCOME_MESSAGE])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [conversationId, setConversationId] = useState<string>()
  const [search, setSearch] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isConversationsLoading, setIsConversationsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [proposalSubmittingId, setProposalSubmittingId] = useState<string>()
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true
    getConversations()
      .then((nextConversations) => {
        if (!isMounted) return
        setConversations(nextConversations)
        const storedId = localStorage.getItem(ACTIVE_CONVERSATION_KEY)
        if (storedId && nextConversations.some((conversation) => conversation.id === storedId)) {
          setIsLoadingMessages(true)
          setConversationId(storedId)
        } else {
          localStorage.removeItem(ACTIVE_CONVERSATION_KEY)
        }
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError instanceof ApiError ? requestError.message : 'Could not load your chats.')
      })
      .finally(() => { if (isMounted) setIsConversationsLoading(false) })

    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    if (!conversationId) return

    let isMounted = true
    Promise.all([getConversationMessages(conversationId), getConversationFinancialEvents(conversationId)])
      .then(([conversationMessages, financialEvents]) => {
        if (!isMounted) return
        const pendingProposals = financialEvents
          .filter((event) => event.status === 'needs_clarification' && (event.missing_fields?.length ?? 0) === 0 && event.extracted_data?.transactions?.length)
          .map((event) => ({ id: event.id, transactions: event.extracted_data!.transactions! }))
        let proposalIndex = 0
        const restoredMessages = conversationMessages
          .filter((message) => message.role === 'user' || message.role === 'assistant')
          .map((message) => {
            const proposalEvent = message.role === 'assistant' && message.content.includes('Review the transaction details') ? pendingProposals[proposalIndex++] : undefined
            return {
              id: message.id,
              role: message.role as CaptureMessage['role'],
              content: message.content,
              ...(proposalEvent ? { proposal: proposalEvent.transactions, financialEventId: proposalEvent.id } : {}),
            }
          })
        setMessages(restoredMessages.length > 0 ? restoredMessages : [WELCOME_MESSAGE])
      })
      .catch(() => {
        if (!isMounted) return
        setConversations((current) => current.filter((conversation) => conversation.id !== conversationId))
        setConversationId(undefined)
        localStorage.removeItem(ACTIVE_CONVERSATION_KEY)
        setMessages([WELCOME_MESSAGE])
      })
      .finally(() => { if (isMounted) setIsLoadingMessages(false) })

    return () => { isMounted = false }
  }, [conversationId])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(frame)
  }, [messages, isSending])

  const activeConversation = useMemo(() => conversations.find((conversation) => conversation.id === conversationId), [conversations, conversationId])
  const statusLabel = isSending ? 'Fincorder is thinking' : isLoadingMessages ? 'Loading chat' : 'Ready to capture'

  function selectConversation(nextConversationId?: string) {
    setError('')
    setIsSidebarOpen(false)
    if (nextConversationId === conversationId) return
    setIsLoadingMessages(Boolean(nextConversationId))
    setConversationId(nextConversationId)
    if (nextConversationId) localStorage.setItem(ACTIVE_CONVERSATION_KEY, nextConversationId)
    else localStorage.removeItem(ACTIVE_CONVERSATION_KEY)
    if (!nextConversationId) setMessages([WELCOME_MESSAGE])
  }

  async function handleCreateConversation() {
    setIsCreating(true)
    setError('')
    try {
      const conversation = await createConversation()
      setConversations((current) => [conversation, ...current.filter((item) => item.id !== conversation.id)])
      selectConversation(conversation.id)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Could not create a new chat.')
    } finally {
      setIsCreating(false)
    }
  }

  async function handleRenameConversation(id: string, title: string) {
    setError('')
    try {
      const updatedConversation = await updateConversation(id, title)
      setConversations((current) => current.map((conversation) => conversation.id === id ? updatedConversation : conversation))
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Could not rename this chat.')
      throw requestError
    }
  }

  async function handleArchiveConversation(id: string) {
    const conversation = conversations.find((item) => item.id === id)
    if (!conversation || !window.confirm('Archive this chat? It will disappear from your active chats.')) return

    setError('')
    try {
      await archiveConversation(id)
      const remaining = conversations.filter((item) => item.id !== id)
      setConversations(remaining)
      if (conversationId === id) selectConversation(remaining[0]?.id)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Could not archive this chat.')
    }
  }

  async function handleConfirmProposal(eventId: string, transactions: TransactionProposal[]) {
    setProposalSubmittingId(eventId)
    setError('')
    try {
      const response = await confirmCapture(eventId, transactions)
      setMessages((current) => current.map((message) => message.financialEventId === eventId ? { ...message, content: response.assistant_message, proposal: undefined } : message))
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Could not save this transaction.')
    } finally {
      setProposalSubmittingId(undefined)
    }
  }

  async function handleRejectProposal(eventId: string) {
    setProposalSubmittingId(eventId)
    setError('')
    try {
      const response = await rejectCapture(eventId)
      setMessages((current) => current.map((message) => message.financialEventId === eventId ? { ...message, content: response.assistant_message, proposal: undefined } : message))
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Could not remove this proposal.')
    } finally {
      setProposalSubmittingId(undefined)
    }
  }

  async function handleSend(content: string) {
    const userMessage: CaptureMessage = { id: `user-${Date.now()}`, role: 'user', content }
    setMessages((current) => [...current, userMessage])
    setError('')
    setIsSending(true)

    try {
      const response = await captureTransaction(content, conversationId)
      const resolvedConversationId = response.conversation_id
      setConversationId(resolvedConversationId)
      localStorage.setItem(ACTIVE_CONVERSATION_KEY, resolvedConversationId)
      setMessages((current) => [
        ...current.map((item) => item.financialEventId === response.financial_event_id ? { ...item, proposal: undefined } : item),
        {
          id: response.assistant_message_id ?? `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.assistant_message,
          ...(response.awaiting_confirmation ? { proposal: response.proposed_transactions, financialEventId: response.financial_event_id } : {}),
        },
      ])

      const currentConversation = conversations.find((conversation) => conversation.id === resolvedConversationId)
      if (!currentConversation || currentConversation.title === 'New Chat' || !currentConversation.title) {
        await updateConversation(resolvedConversationId, getConversationTitle(content)).catch(() => undefined)
      }
      const latestConversations = await getConversations()
      setConversations(latestConversations)
    } catch (requestError) {
      const message = requestError instanceof ApiError ? requestError.message : 'I could not reach the Fincorder backend. Check that the API is running and try again.'
      setError(message)
      setMessages((current) => [...current, { id: `error-${Date.now()}`, role: 'assistant', content: 'I couldn\'t record that yet. Please check the connection and try again.' }])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <AppShell>
      <section className="mx-auto flex h-[calc(100svh-5rem)] min-h-0 w-full flex-col overflow-hidden px-4 pb-28 sm:px-8 lg:px-12">
        <button type="button" aria-label="Open conversations" onClick={() => setIsSidebarOpen(true)} className="fixed left-4 top-24 z-40 grid size-10 place-items-center rounded-xl border border-slate-200 bg-white/95 text-slate-500 shadow-lg shadow-slate-900/10 backdrop-blur transition hover:border-orange-300 hover:text-orange-500 dark:border-slate-700 dark:bg-[#101d31]/95 dark:text-slate-300 lg:hidden"><Menu size={18} /></button>
        <div className="mx-auto grid min-h-0 w-full max-w-[1480px] flex-1 gap-5 overflow-hidden pt-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:pt-5">
          <ConversationSidebar
            conversations={conversations}
            activeId={conversationId}
            search={search}
            isLoading={isConversationsLoading}
            isCreating={isCreating}
            isOpen={isSidebarOpen}
            onSearch={setSearch}
            onCreate={() => void handleCreateConversation()}
            onSelect={selectConversation}
            onRename={handleRenameConversation}
            onArchive={(id) => void handleArchiveConversation(id)}
            onClose={() => setIsSidebarOpen(false)}
          />

          <main className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto py-4 pr-1 [scrollbar-color:#cbd5e1_transparent] dark:[scrollbar-color:#334155_transparent]">
              <div className="flex items-center justify-between py-2 pb-6 pl-12 lg:pl-0 sm:py-3 sm:pb-7">
                <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-500">capture</p><h1 className="mt-1 truncate text-2xl font-bold tracking-[-0.07em] text-slate-950 dark:text-white sm:text-3xl">{activeConversation?.title || 'What happened?'}</h1></div>
                <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:flex dark:border-slate-700 dark:bg-[#101d31]"><span className={`size-1.5 rounded-full ${isSending ? 'animate-pulse-soft bg-orange-500' : 'bg-emerald-500'}`} /> {statusLabel}</div>
              </div>
              <div className="space-y-5">
              {isLoadingMessages && <div className="flex items-center justify-center py-10"><div className="size-7 animate-spin rounded-full border-2 border-orange-500/20 border-t-orange-500" /></div>}
              {!isLoadingMessages && messages.map((message, index) => <MessageBubble key={message.id} message={message} isLatest={index === messages.length - 1} onConfirmProposal={(eventId, transactions) => void handleConfirmProposal(eventId, transactions)} onRejectProposal={(eventId) => void handleRejectProposal(eventId)} isProposalSubmitting={message.financialEventId === proposalSubmittingId} />)}
              {isSending && <div className="flex items-end gap-3 animate-message-in"><div className="grid size-8 place-items-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300"><Sparkles size={16} /></div><div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-[#132238]"><span className="size-1.5 animate-pulse-soft rounded-full bg-orange-400" /><span className="size-1.5 animate-pulse-soft rounded-full bg-orange-400 [animation-delay:150ms]" /><span className="size-1.5 animate-pulse-soft rounded-full bg-orange-400 [animation-delay:300ms]" /></div></div>}
              </div>
            </div>

            <div className="shrink-0 pt-4"><ChatComposer disabled={isSending || isLoadingMessages} onSend={handleSend} />{error && <p className="mt-2 flex items-center gap-1.5 px-2 text-xs font-semibold text-red-500"><CircleCheck size={13} className="rotate-45" /> {error}</p>}</div>
          </main>
        </div>
      </section>
    </AppShell>
  )
}
