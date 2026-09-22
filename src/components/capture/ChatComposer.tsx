import { ArrowUp, Mic, Paperclip } from 'lucide-react'
import { useRef, useState } from 'react'

interface ChatComposerProps { disabled?: boolean; onSend: (message: string) => void }

export function ChatComposer({ disabled = false, onSend }: ChatComposerProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function submit() {
    const message = value.trim()
    if (!message || disabled) return
    onSend(message)
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit() }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-transparent p-2 transition focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-500/10 dark:border-slate-700 dark:bg-transparent dark:focus-within:border-orange-500/60">
      <textarea ref={textareaRef} value={value} rows={1} disabled={disabled} onChange={(event) => { setValue(event.target.value); event.currentTarget.style.height = 'auto'; event.currentTarget.style.height = String(Math.min(event.currentTarget.scrollHeight, 132)) + 'px' }} onKeyDown={handleKeyDown} placeholder="Tell me what happened..." className="max-h-32 min-h-11 w-full resize-none bg-transparent px-3 py-2.5 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-50 dark:text-white dark:placeholder:text-slate-500" />
      <div className="flex items-center justify-between px-1 pb-1">
        <div className="flex items-center gap-1">
          <button type="button" disabled aria-label="Upload receipt coming soon" className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800"><Paperclip size={17} /></button>
          <button type="button" disabled aria-label="Voice input coming soon" className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800"><Mic size={17} /></button>
          <span className="hidden pl-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 sm:inline">shift + enter for a new line</span>
        </div>
        <button type="button" onClick={submit} disabled={disabled || !value.trim()} aria-label="Send message" className="grid size-9 place-items-center rounded-xl bg-orange-500 text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"><ArrowUp size={18} strokeWidth={2.5} /></button>
      </div>
    </div>
  )
}
