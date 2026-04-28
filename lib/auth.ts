import type { AuthPayload, UserRole } from '@/types';

const TOKEN_KEY = 'fh_token';
const USER_KEY = 'fh_user';

export function mockLogin(email: string, _password: string): AuthPayload {
  if (!email.endsWith('@iitb.ac.in')) {
    throw new Error('Only @iitb.ac.in email addresses are allowed.');
  }

  const lower = email.toLowerCase();
  let role: UserRole = 'student';
  let name = 'Arjun Sharma';

  if (lower.includes('admin')) {
    role = 'admin';
    name = 'Dr. Rajesh Kumar';
  } else if (lower.includes('associate')) {
    role = 'associate-instructor';
    name = 'Ms. Neha Gupta';
  } else if (lower.includes('instructor')) {
    role = 'instructor';
    name = 'Dr. Ananya Krishnan';
  } else if (lower.includes('volunteer')) {
    role = 'volunteer';
    name = 'Priya Patel';
  }

  const payload: AuthPayload = {
    id: `user_${Math.random().toString(36).slice(2, 9)}`,
    email,
    name,
    role,
    department: 'Computer Science & Engineering',
    rollNo: role === 'student' || role === 'volunteer' ? '23B030012' : undefined,
    iat: Date.now(),
  };

  const token = btoa(JSON.stringify(payload));

  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(payload));
    document.cookie = `fh_auth=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
  }

  return payload;
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    document.cookie = 'fh_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  }
}

export function getStoredUser(): AuthPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthPayload) : null;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function decodeToken(token: string): AuthPayload | null {
  try {
    return JSON.parse(atob(token)) as AuthPayload;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  const token = getStoredToken();
  if (!token) return false;
  const payload = decodeToken(token);
  return !!payload;
}
