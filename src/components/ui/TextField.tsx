import { Eye, EyeOff } from 'lucide-react'
import { useState, type InputHTMLAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function TextField({ label, error, type, id, ...props }: TextFieldProps) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">{label}</label>
      <div className="relative">
        <input id={id} type={isPassword && visible ? 'text' : type} aria-invalid={Boolean(error)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-orange-400" {...props} />
        {isPassword && <button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-orange-500 dark:hover:bg-slate-800">{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button>}
      </div>
      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
    </div>
  )
}
