import type { AuthUser } from '@/types/auth';

export const AUTH_KEY = 'crm_auth_user';

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(AUTH_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function storeUser(user: AuthUser, email?: string, password?: string): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  localStorage.setItem('accessToken', user.accessToken);
  // Store credentials for token refresh (used by api.ts)
  if (email) localStorage.setItem('userEmail', email);
  if (password) localStorage.setItem('userPassword', password);
  console.log('[Auth] User stored in localStorage', {
    user: user.email,
    token: user.accessToken?.substring(0, 20) + '...',
    hasEmail: !!email,
    hasPassword: !!password
  });
}

export function clearUser(): void {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem('accessToken');
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!getStoredUser();
}

export function getUserRole(): string | null {
  const user = getStoredUser();
  return user?.role || null;
}

export function canViewAll(): boolean {
  const role = getUserRole();
  return role === 'ADMIN' || role === 'MARKETING';
}

export function canEditSettings(): boolean {
  const role = getUserRole();
  return role === 'ADMIN';
}
