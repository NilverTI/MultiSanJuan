'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/services/api';
import { config } from '@/config';

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  roles: string[];
  permissions: string[];
  _permSet?: Set<string>;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const enrichUser = useCallback((u: any): AuthUser => {
    if (!u) return u;
    return { ...u, _permSet: new Set(u.permissions || []) };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(config.storageKeys.user);
    const token = localStorage.getItem(config.storageKeys.token);
    if (stored && token) {
      try {
        setUser(enrichUser(JSON.parse(stored)));
      } catch {
        localStorage.removeItem(config.storageKeys.user);
        localStorage.removeItem(config.storageKeys.token);
      }
    }
    setLoading(false);
  }, [enrichUser]);

  const login = useCallback(async (username: string, password: string) => {
    const response = await authApi.login(username, password);
    localStorage.setItem(config.storageKeys.token, response.accessToken);
    localStorage.setItem(config.storageKeys.refreshToken, response.refreshToken);
    const enriched = enrichUser(response.user);
    localStorage.setItem(config.storageKeys.user, JSON.stringify(response.user));
    setUser(enriched);
    router.push('/');
  }, [router, enrichUser]);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem(config.storageKeys.token);
    localStorage.removeItem(config.storageKeys.refreshToken);
    localStorage.removeItem(config.storageKeys.user);
    setUser(null);
    router.push('/login');
  }, [router]);

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;
    return user._permSet?.has(permission) ?? user.permissions.includes(permission);
  }, [user]);

  const hasAnyPermission = useCallback((permissions: string[]) => {
    if (!user) return false;
    if (user.roles.includes('Super Admin')) return true;
    const set = user._permSet;
    if (set) return permissions.some(p => set.has(p));
    return permissions.some(p => user.permissions.includes(p));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, hasAnyPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
