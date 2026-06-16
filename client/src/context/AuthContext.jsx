/**
 * Authentication Context.
 *
 * Provides authentication state and methods to the entire component tree.
 * Persists the session to localStorage so refreshing the page doesn't
 * log the user out.
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

const STORAGE_KEY = 'equiflow_session';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email) => {
    const response = await authAPI.login(email);
    const userData = response.data;
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (user?.token) {
        await authAPI.logout(user.token);
      }
    } catch {
      // Ignore logout errors — we clear local state regardless
    }
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const value = {
    user,
    token: user?.token || null,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context.
 * @returns {{ user: Object, token: string, isAuthenticated: boolean, loading: boolean, login: Function, logout: Function }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
