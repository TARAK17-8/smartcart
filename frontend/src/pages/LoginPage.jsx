import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage({ defaultMode }) {
  const [mode, setMode] = useState(defaultMode || null) // null | 'shopkeeper' | 'admin'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isLoggedIn } = useAuth()
  const navigate = useNavigate()

  if (isLoggedIn) {
    navigate('/admin', { replace: true })
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(username, password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = mode === 'admin'

  // Role selection screen
  if (!mode) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="animate-fade-in-up w-full max-w-lg">
          <div className="glass-card p-8">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-3xl shadow-lg shadow-primary-500/20">
                🔐
              </div>
              <h2 className="text-2xl font-bold text-white">Welcome to SmartCart</h2>
              <p className="mt-2 text-sm text-surface-400">Choose your login type to continue</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Shopkeeper Login Button */}
              <button
                onClick={() => { navigate('/shop-login'); setMode('shopkeeper'); setUsername(''); setPassword('') }}
                className="group relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-600/5 p-6 text-center transition-all hover:border-emerald-500/60 hover:from-emerald-500/20 hover:to-teal-600/10 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98]"
              >
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/15 text-2xl transition-transform group-hover:scale-110">
                  🏪
                </div>
                <h3 className="text-base font-bold text-white mb-1">Shopkeeper Login</h3>
                <p className="text-[11px] text-surface-500">Manage your own shop</p>
              </button>

              {/* Admin Login Button */}
              <button
                onClick={() => { navigate('/admin-login'); setMode('admin'); setUsername(''); setPassword('') }}
                className="group relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-600/5 p-6 text-center transition-all hover:border-amber-500/60 hover:from-amber-500/20 hover:to-orange-600/10 hover:shadow-lg hover:shadow-amber-500/10 active:scale-[0.98]"
              >
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/15 text-2xl transition-transform group-hover:scale-110">
                  👤
                </div>
                <h3 className="text-base font-bold text-white mb-1">Admin Login</h3>
                <p className="text-[11px] text-surface-500">Approve shops & monitor</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="animate-fade-in-up w-full max-w-md">
        {/* Credentials hint */}
        {isAdmin ? (
          <div className="mb-4 rounded-xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 px-5 py-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-yellow-400 mb-1">🔑 Demo Admin Credentials</p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <span className="rounded-lg bg-yellow-500/15 px-3 py-1.5 font-mono font-bold text-yellow-300">admin</span>
              <span className="text-surface-500">/</span>
              <span className="rounded-lg bg-yellow-500/15 px-3 py-1.5 font-mono font-bold text-yellow-300">admin</span>
            </div>
          </div>
        ) : (
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-5 py-3.5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">🏪 Shopkeeper Login</p>
            <p className="text-sm text-emerald-300/80">
              Use your <span className="font-semibold text-emerald-300">shop name</span> as both username &amp; password
            </p>
            <p className="text-[11px] text-surface-500 mt-1">Only approved shops can login</p>
          </div>
        )}

        <div className="glass-card p-8">
          <div className="mb-6 text-center">
            <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${
              isAdmin ? 'from-amber-500 to-orange-600 shadow-amber-500/20' : 'from-emerald-500 to-teal-600 shadow-emerald-500/20'
            } text-2xl shadow-lg`}>
              {isAdmin ? '👤' : '🏪'}
            </div>
            <h2 className="text-xl font-bold text-white">{isAdmin ? 'Admin Login' : 'Shopkeeper Login'}</h2>
            <p className="mt-1 text-sm text-surface-400">{isAdmin ? 'Approve shops & monitor system' : 'Manage your shop inventory & orders'}</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm text-red-300">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-surface-400">
                {isAdmin ? 'Username' : 'Shop Name'}
              </label>
              <input
                id="login-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isAdmin ? 'Enter username' : 'Enter your shop name'}
                className="w-full rounded-xl border border-surface-700 bg-surface-800/50 px-4 py-3 text-sm text-white placeholder-surface-600 outline-none transition-colors focus:border-primary-500/50 search-input"
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
                placeholder={isAdmin ? 'Enter password' : 'Enter your shop name again'}
                className="w-full rounded-xl border border-surface-700 bg-surface-800/50 px-4 py-3 text-sm text-white placeholder-surface-600 outline-none transition-colors focus:border-primary-500/50 search-input"
                required
              />
            </div>

            {isAdmin && (
              <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 px-3 py-2.5">
                <p className="text-[11px] text-surface-400">
                  <span className="font-semibold text-yellow-400">Demo Admin Credentials:</span> admin / admin
                </p>
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className={`w-full rounded-xl bg-gradient-to-r ${
                isAdmin ? 'from-amber-600 to-orange-500 shadow-amber-500/20' : 'from-emerald-600 to-teal-500 shadow-emerald-500/20'
              } py-3 text-sm font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50`}
            >
              {loading ? 'Logging in...' : `Login as ${isAdmin ? 'Admin' : 'Shopkeeper'}`}
            </button>
          </form>

          <button
            onClick={() => { 
              setMode(null)
              setError('')
              navigate('/login')
            }}
            className="mt-4 w-full rounded-lg py-2 text-xs font-medium text-surface-500 transition-colors hover:bg-surface-800 hover:text-surface-300"
          >
            ← Back to login options
          </button>
        </div>
      </div>
    </div>
  )
}
