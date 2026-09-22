import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { AuthShell } from '../../components/auth/AuthShell'
import { TextField } from '../../components/ui/TextField'
import { ApiError } from '../../services/api/client'
import { register } from '../../services/api/auth'
import { useAuth } from '../../context/AuthContext'

export function SignupPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(''); const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('')
    if (password.length < 8) { setError('Your password must be at least 8 characters.'); return }
    if (password !== confirmPassword) { setError('The passwords do not match.'); return }
    setIsLoading(true)
    try {
      await register({ name, email, password })
      await signIn({ email, password })
      navigate('/app')
    } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Unable to connect to Fincorder.') }
    finally { setIsLoading(false) }
  }

  return (
    <AuthShell eyebrow="start your workspace" title="Make money make sense." description="Create your personal finance workspace in less than a minute.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField id="name" label="Your name" type="text" placeholder="John Doe" value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" />
        <TextField id="signup-email" label="Email address" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
        <TextField id="signup-password" label="Password" type="password" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="new-password" />
        <TextField id="confirm-password" label="Confirm password" type="password" placeholder="Repeat your password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required autoComplete="new-password" />
        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
        <button disabled={isLoading} className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">{isLoading ? <LoaderCircle className="animate-spin" size={17} /> : <>Create workspace <ArrowRight size={17} /></>}</button>
      </form>
      <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">Already have an account? <Link className="font-bold text-orange-500 hover:text-orange-600" to="/login">Sign in</Link></p>
    </AuthShell>
  )
}
