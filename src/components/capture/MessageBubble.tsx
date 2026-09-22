import { Bot, UserRound } from 'lucide-react'
import { AVATAR_KEY } from '../../context/AuthContext'
import type { CaptureMessage, TransactionProposal } from '../../types/capture'
import { TransactionProposalCard } from './TransactionProposalCard'

interface MessageBubbleProps {
  message: CaptureMessage
  isLatest?: boolean
  onConfirmProposal?: (eventId: string, transactions: TransactionProposal[]) => void
  onRejectProposal?: (eventId: string) => void
  isProposalSubmitting?: boolean
}

export function MessageBubble({ message, isLatest = false, onConfirmProposal, onRejectProposal, isProposalSubmitting = false }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const avatar = isUser ? localStorage.getItem(AVATAR_KEY) : null
  return (
    <div className={['flex w-full items-end gap-3', isUser ? 'justify-end' : 'justify-start', isLatest ? 'animate-message-in' : ''].join(' ')}>
      {!isUser && <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300"><Bot size={16} /></div>}
      <div className="flex min-w-0 max-w-[min(82%,42rem)] flex-col items-start">
        <div className={['w-fit rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm sm:px-5', isUser ? 'self-end rounded-br-md bg-orange-500 text-white shadow-orange-500/10' : 'rounded-bl-md border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-[#132238] dark:text-slate-200'].join(' ')}>{message.content}</div>
        {message.proposal && message.financialEventId && onConfirmProposal && onRejectProposal && <TransactionProposalCard transactions={message.proposal} onConfirm={(transactions) => onConfirmProposal(message.financialEventId!, transactions)} onReject={() => onRejectProposal(message.financialEventId!)} isSubmitting={isProposalSubmitting} />}
      </div>
      {isUser && <div className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">{avatar ? <img src={avatar} alt="Your profile" className="size-full object-cover" /> : <UserRound size={16} />}</div>}
    </div>
  )
}
