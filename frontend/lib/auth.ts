import { User, UserRole } from './types';

const AUTH_STORAGE_KEY = 'factory_auth_token';
const USER_STORAGE_KEY = 'factory_user';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
  role: UserRole;
}

export interface AuthToken {
  userId: string;
  username: string;
  role: UserRole;
  issuedAt: number;
  expiresAt: number;
}

const BACKEND_URL = 'http://localhost:4000';

/**
 * Performs login via backend API and caches the returned JWT
 */
export async function login(credentials: LoginCredentials): Promise<{ user: User; token: string } | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data.success || !data.token) {
      return null;
    }

    const user: User = {
      id: data.user.id,
      username: data.user.username,
      role: data.user.role,
      lastLogin: new Date()
    };

    // Store raw JWT string and Profile in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, data.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }

    return { user, token: data.token };
  } catch (err) {
    console.error('Login request failed:', err);
    return null;
  }
}

/**
 * Performs registration via backend API and caches the returned JWT
 */
export async function register(credentials: RegisterCredentials): Promise<{ user: User; token: string } | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data.success || !data.token) {
      return null;
    }

    const user: User = {
      id: data.user.id,
      username: data.user.username,
      role: data.user.role,
      lastLogin: new Date()
    };

    // Store raw JWT string and Profile in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, data.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }

    return { user, token: data.token };
  } catch (err) {
    console.error('Registration request failed:', err);
    return null;
  }
}

/**
 * Logs the user out
 */
export function logout(): void {
  try {
    fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).catch(() => {});
  } catch (e) {}

  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

/**
 * Retrieves the current logged-in user profile from cache
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;

  const userStr = localStorage.getItem(USER_STORAGE_KEY);
  const token = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!userStr || !token) return null;

  try {
    const user = JSON.parse(userStr) as User;
    return user;
  } catch {
    logout();
    return null;
  }
}

/**
 * Retrieves the raw JWT token from cache
 */
export function getCurrentToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_STORAGE_KEY);
}

/**
 * Checks if the client has a valid session token
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

/**
 * Role checking helpers
 */
export function hasRole(role: UserRole): boolean {
  const user = getCurrentUser();
  return user?.role === role;
}

export function isAdmin(): boolean {
  return hasRole('admin');
}

export function isDeveloper(): boolean {
  return hasRole('developer');
}

/**
 * Returns seeded credentials for UI quick login aids
 */
export function getMockLoginCredentials(): Array<{ username: string; password: string; role: UserRole }> {
  return [
    { username: 'admin', password: 'password123', role: 'admin' },
    { username: 'dev1', password: 'password123', role: 'developer' },
    { username: 'dev2', password: 'password123', role: 'developer' }
  ];
}
