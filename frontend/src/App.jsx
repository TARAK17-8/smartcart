import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import useGeolocation from './hooks/useGeolocation'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { CartProvider, useCart } from './hooks/useCart'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import LoginPage from './pages/LoginPage'
import CartDrawer from './components/CartDrawer'

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center py-20"><div className="shimmer h-8 w-32 rounded-lg" /></div>
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return children
}

const navLinks = [
  { to: '/', label: 'User Dashboard', icon: '🔍' },
  { to: '/admin', label: 'Admin Panel', icon: '🏪', protected: true },
]

function AppContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const geo = useGeolocation()
  const { isLoggedIn, logout, username } = useAuth()
  const { totalItems, setIsOpen: setCartOpen } = useCart()

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-surface-950 bg-grid-pattern">
        {/* Top Navigation */}
        <nav className="sticky top-0 z-50 border-b border-surface-800/60 bg-surface-950/80 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-lg shadow-lg shadow-primary-500/20">
                  🛒
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-white">
                    Smart<span className="gradient-text">Cart</span>
                  </h1>
                  <p className="hidden text-[10px] font-medium tracking-widest text-surface-500 uppercase sm:block">
                    Price Optimizer
                  </p>
                </div>
              </div>

              {/* Desktop Nav */}
              <div className="hidden items-center gap-1 md:flex">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-500/10 text-primary-300 nav-active'
                          : 'text-surface-400 hover:bg-surface-800/60 hover:text-surface-200'
                      }`
                    }
                  >
                    <span>{link.icon}</span>
                    {link.label}
                  </NavLink>
                ))}
              </div>

              {/* Right side: Cart + Auth + Location */}
              <div className="flex items-center gap-2">
                {/* Cart button */}
                <button
                  onClick={() => setCartOpen(true)}
                  className="relative flex items-center gap-1.5 rounded-lg bg-surface-800/60 px-3 py-1.5 text-sm transition-all hover:bg-surface-700/60"
                >
                  <span>🛒</span>
                  {totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-white shadow-lg shadow-accent-500/30">
                      {totalItems}
                    </span>
                  )}
                </button>

                {/* Auth badge */}
                {isLoggedIn ? (
                  <div className="hidden items-center gap-2 md:flex">
                    <span className="rounded-full bg-accent-500/10 px-2.5 py-1 text-[10px] font-bold text-accent-400">
                      👤 {username}
                    </span>
                    <button
                      onClick={logout}
                      className="rounded-lg px-2 py-1 text-[11px] font-medium text-surface-500 hover:bg-surface-800 hover:text-red-400"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <NavLink
                    to="/login"
                    className="hidden rounded-lg bg-primary-500/10 px-3 py-1.5 text-xs font-semibold text-primary-300 transition-all hover:bg-primary-500/20 md:flex"
                  >
                    Admin Login
                  </NavLink>
                )}

                {/* Live Location Badge */}
                <button
                  onClick={geo.requestLocation}
                  className="hidden items-center gap-2 rounded-full bg-surface-800/60 px-3 py-1.5 transition-all hover:bg-surface-700/60 lg:flex"
                  title={geo.isLive ? `Accuracy: ~${geo.accuracy}m` : 'Click to detect your location'}
                >
                  {geo.loading ? (
                    <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
                  ) : geo.isLive ? (
                    <span className="h-2 w-2 rounded-full bg-accent-400 shadow-sm shadow-accent-400/50" />
                  ) : (
                    <span className="text-xs">📍</span>
                  )}
                  <span className="text-xs font-medium text-surface-400">
                    {geo.loading ? 'Detecting...' : geo.isLive ? `Live: ${geo.label}` : 'Gajuwaka, Vizag'}
                  </span>
                </button>

                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="rounded-lg p-2 text-surface-400 hover:bg-surface-800 md:hidden"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <div className="border-t border-surface-800/60 px-4 pb-4 pt-2 md:hidden">
              <button
                onClick={geo.requestLocation}
                className="mb-2 flex w-full items-center gap-2 rounded-lg bg-surface-800/40 px-3 py-2 text-xs text-surface-400"
              >
                {geo.isLive ? <span className="h-2 w-2 rounded-full bg-accent-400" /> : <span>📍</span>}
                {geo.loading ? 'Detecting location...' : geo.isLive ? `Live: ${geo.label}` : 'Tap to detect location'}
              </button>

              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary-500/10 text-primary-300'
                        : 'text-surface-400 hover:bg-surface-800/60 hover:text-surface-200'
                    }`
                  }
                >
                  <span>{link.icon}</span>
                  {link.label}
                </NavLink>
              ))}

              {isLoggedIn ? (
                <button onClick={logout} className="mt-2 w-full rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400">
                  Logout ({username})
                </button>
              ) : (
                <NavLink to="/login" onClick={() => setMobileMenuOpen(false)} className="mt-2 block rounded-lg bg-primary-500/10 px-3 py-2 text-center text-xs font-semibold text-primary-300">
                  Admin Login
                </NavLink>
              )}
            </div>
          )}
        </nav>

        {/* Page Content */}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard geo={geo} />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          </Routes>
        </main>

        {/* Cart Drawer */}
        <CartDrawer />

        {/* Footer */}
        <footer className="border-t border-surface-800/40 py-6 text-center">
          <p className="text-xs text-surface-600">
            SmartCart © 2026 — Intelligent Local + Online Price Optimization
          </p>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  )
}
