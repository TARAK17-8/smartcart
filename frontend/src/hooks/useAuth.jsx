import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { login as apiLogin, verifyAuth } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    isLoggedIn: false,
    username: null,
    role: null,
    loading: true,
  })

  useEffect(() => {
    const token = localStorage.getItem('smartcart_token')
    if (token) {
      verifyAuth()
        .then((data) => {
          setAuth({ isLoggedIn: true, username: data.username, role: data.role || 'admin', loading: false })
        })
        .catch(() => {
          localStorage.removeItem('smartcart_token')
          setAuth({ isLoggedIn: false, username: null, role: null, loading: false })
        })
    } else {
      setAuth((prev) => ({ ...prev, loading: false }))
    }
  }, [])

  const login = useCallback(async (username, password) => {
    const data = await apiLogin(username, password)
    localStorage.setItem('smartcart_token', data.token)
    setAuth({ isLoggedIn: true, username: data.username, role: data.role || 'admin', loading: false })
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('smartcart_token')
    setAuth({ isLoggedIn: false, username: null, role: null, loading: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
