import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export function CapturePreferences() {
  const { user, savePreferences } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const reviewEnabled = user?.review_transactions !== false

  async function update(preferences: { review_transactions?: boolean; timezone?: string }) {
    setSaving(true)
    setError('')
    try { await savePreferences(preferences) }
    catch { setError('Could not save your preference. Please try again.') }
    finally { setSaving(false) }
  }
  return <div className="mt-5 space-y-3 rounded-2xl border border-orange-200 p-4 dark:border-orange-500/25">
    <p className="text-xs font-black text-slate-800 dark:text-slate-100">Transaction capture</p>
    <div className="flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300">
      <button
        type="button"
        role="switch"
        aria-checked={reviewEnabled}
        aria-label="Review transactions before saving"
        disabled={saving}
        onClick={() => void update({ review_transactions: !reviewEnabled })}
        className={['relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-orange-500/15 disabled:cursor-not-allowed disabled:opacity-60', reviewEnabled ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'].join(' ')}
      >
        <span className={['size-4 rounded-full bg-white shadow-sm transition-transform duration-200', reviewEnabled ? 'translate-x-5' : 'translate-x-0'].join(' ')} />
      </button>
      <span><span className="font-bold">Review before saving</span><span className="mt-1 block leading-5">{reviewEnabled ? 'Review and edit each proposal before applying it.' : 'AI automatically adds, updates and archives transactions. Incomplete requests still ask for details.'}</span></span>
    </div>
    <p className="text-[11px] text-slate-500 dark:text-slate-400">Existing pending proposals still need your confirmation.</p>
    <p className="text-[11px] text-slate-500 dark:text-slate-400">Date timezone: {user?.timezone ?? 'UTC'}</p>
    <button type="button" disabled={saving} onClick={() => void update({ timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })} className="text-xs font-bold text-orange-600 disabled:opacity-50 dark:text-orange-300">Use this device’s timezone</button>
    {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
  </div>
}
