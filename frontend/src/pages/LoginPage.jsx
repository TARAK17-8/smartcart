import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isLoggedIn } = useAuth()
  const navigate = useNavigate()

  // If already logged in, redirect
  if (isLoggedIn) {
    navigate('/admin', { replace: true })
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="animate-fade-in-up w-full max-w-md">
        {/* Demo credentials badge */}
        <div className="mb-6 rounded-xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 px-5 py-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-yellow-400 mb-1">🔑 Demo Admin Login</p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="rounded-lg bg-yellow-500/15 px-3 py-1.5 font-mono font-bold text-yellow-300">
              Username: admin
            </span>
            <span className="rounded-lg bg-yellow-500/15 px-3 py-1.5 font-mono font-bold text-yellow-300">
              Password: admin
            </span>
          </div>
        </div>

        <div className="glass-card p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-2xl shadow-lg shadow-primary-500/20">
              🔐
            </div>
            <h2 className="text-xl font-bold text-white">Admin Login</h2>
            <p className="mt-1 text-sm text-surface-400">Access the shop management panel</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm text-red-300">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-surface-400">Username</label>
              <input
                id="login-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full rounded-xl border border-surface-700 bg-surface-800/50 px-4 py-3 text-sm text-white placeholder-surface-600 outline-none focus:border-primary-500/50 search-input"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-surface-400">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl border border-surface-700 bg-surface-800/50 px-4 py-3 text-sm text-white placeholder-surface-600 outline-none focus:border-primary-500/50 search-input"
                required
              />
            </div>
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login to Admin Panel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
