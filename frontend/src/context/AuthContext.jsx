import { createContext, useContext, useState, useEffect } from 'react';
import { isLoggedIn, logoutAdmin } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(isLoggedIn());

  useEffect(() => {
    // Sync with localStorage changes
    const check = () => setAuthenticated(isLoggedIn());
    window.addEventListener('storage', check);
    return () => window.removeEventListener('storage', check);
  }, []);

  const login = () => setAuthenticated(true);

  const logout = () => {
    logoutAdmin();
    setAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ authenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
