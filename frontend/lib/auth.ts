import { User, UserRole } from './types';

const AUTH_STORAGE_KEY = 'factory_auth_token';
const USER_STORAGE_KEY = 'factory_user';

// Mock users for demo
const MOCK_USERS: Record<string, { password: string; role: UserRole }> = {
  'admin@factory.com': {
    password: 'admin123',
    role: 'admin',
  },
  'developer@factory.com': {
    password: 'dev123',
    role: 'developer',
  },
};

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthToken {
  userId: string;
  username: string;
  role: UserRole;
  issuedAt: number;
  expiresAt: number;
}

export function generateMockToken(username: string, role: UserRole): AuthToken {
  const now = Date.now();
  return {
    userId: `user-${Date.now()}`,
    username,
    role,
    issuedAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours
  };
}

export function login(credentials: LoginCredentials): { user: User; token: AuthToken } | null {
  const mockUser = MOCK_USERS[credentials.username];

  if (!mockUser || mockUser.password !== credentials.password) {
    return null;
  }

  const token = generateMockToken(credentials.username, mockUser.role);
  const user: User = {
    id: token.userId,
    username: credentials.username,
    role: mockUser.role,
    lastLogin: new Date(),
  };

  // Store in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(token));
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  return { user, token };
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;

  const userStr = localStorage.getItem(USER_STORAGE_KEY);
  const tokenStr = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!userStr || !tokenStr) return null;

  try {
    const token = JSON.parse(tokenStr) as AuthToken;
    const user = JSON.parse(userStr) as User;

    // Check if token is expired
    if (token.expiresAt < Date.now()) {
      logout();
      return null;
    }

    return user;
  } catch {
    logout();
    return null;
  }
}

export function getCurrentToken(): AuthToken | null {
  if (typeof window === 'undefined') return null;

  const tokenStr = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!tokenStr) return null;

  try {
    const token = JSON.parse(tokenStr) as AuthToken;

    // Check if token is expired
    if (token.expiresAt < Date.now()) {
      logout();
      return null;
    }

    return token;
  } catch {
    logout();
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

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

export function getMockLoginCredentials(): Array<{ username: string; password: string; role: UserRole }> {
  return Object.entries(MOCK_USERS).map(([username, { password, role }]) => ({
    username,
    password,
    role,
  }));
}
