import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { AuthShell } from '../../components/auth/AuthShell'
import { TextField } from '../../components/ui/TextField'
import { ApiError } from '../../services/api/client'
import { useAuth } from '../../context/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setIsLoading(true)
    try {
      await signIn({ email, password })
      navigate('/app')
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to connect to Fincorder.')
    } finally { setIsLoading(false) }
  }

  return (
    <AuthShell eyebrow="welcome back" title="Good to see you again." description="Sign in to pick up exactly where you left off.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <TextField id="email" label="Email address" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
        <TextField id="password" label="Password" type="password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
        <button disabled={isLoading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">{isLoading ? <LoaderCircle className="animate-spin" size={17} /> : <>Continue <ArrowRight size={17} /></>}</button>
      </form>
      <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">New to Fincorder? <Link className="font-bold text-orange-500 hover:text-orange-600" to="/signup">Create an account</Link></p>
    </AuthShell>
  )
}
