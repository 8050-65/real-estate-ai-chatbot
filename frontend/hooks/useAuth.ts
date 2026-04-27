'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser, LoginRequest } from '@/types/auth';
import { getStoredUser, storeUser, clearUser } from '@/lib/auth';
import api from '@/lib/api';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const res = await api.post<{ data: AuthUser }>('/api/v1/auth/login', {
        email,
        password,
      });
      const userData = res.data.data;
      storeUser(userData);
      setUser(userData);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message =
        (err as any)?.response?.data?.message || 'Login failed';
      setError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => {
    clearUser();
    setUser(null);
    router.push('/login');
  };

  const isAuthenticated = !!user;

  return {
    user,
    loading,
    isAuthenticated,
    isLoggingIn,
    error,
    login,
    logout,
  };
}
