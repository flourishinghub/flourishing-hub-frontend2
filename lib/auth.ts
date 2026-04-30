import type { AuthPayload, UserRole, Programme } from '@/types';

const TOKEN_KEY = 'fh_token';
const USER_KEY = 'fh_user';

function setAuthCookie(token: string) {
  document.cookie = `fh_auth=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
}

function clearAuthCookie() {
  document.cookie = 'fh_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
}

export function mockLogin(email: string, _password: string): AuthPayload {
  if (!email.endsWith('@iitb.ac.in')) {
    throw new Error('Only @iitb.ac.in email addresses are allowed.');
  }

  const lower = email.toLowerCase();
  let role: UserRole = 'student';
  let name = 'Arjun Sharma';
  let rollNo: string | undefined = '23B030012';
  let empId: string | undefined;
  let year: number | undefined = 2;
  let batch: string | undefined = '2023';
  let programme: Programme = 'BTech';

  if (lower.includes('admin')) {
    role = 'admin';
    name = 'Dr. Rajesh Kumar';
    empId = 'EMP0001';
    rollNo = undefined;
    year = undefined;
    batch = undefined;
    programme = 'Staff';
  } else if (lower.includes('associate')) {
    role = 'associate-instructor';
    name = 'Ms. Neha Gupta';
    empId = 'EMP3001';
    rollNo = undefined;
    year = undefined;
    batch = undefined;
    programme = 'Staff';
  } else if (lower.includes('instructor')) {
    role = 'instructor';
    name = 'Dr. Ananya Krishnan';
    empId = 'EMP2001';
    rollNo = undefined;
    year = undefined;
    batch = undefined;
    programme = 'Staff';
  } else if (lower.includes('volunteer')) {
    role = 'volunteer';
    name = 'Sana Iyer';
    rollNo = '23B050011';
  }

  const payload: AuthPayload = {
    id: `user_${Math.random().toString(36).slice(2, 9)}`,
    email,
    name,
    role,
    department: role === 'student' || role === 'volunteer' ? 'Computer Science & Engineering' : 'Student Wellness Center',
    rollNo,
    empId,
    year,
    batch,
    programme,
    iat: Date.now(),
  };

  const token = btoa(JSON.stringify(payload));

  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(payload));
    setAuthCookie(token);
  }

  return payload;
}

export function mockSignup(data: {
  name: string;
  rollNo: string;
  year: string;
  batch: string;
  programme: Programme;
  department: string;
  email: string;
  password: string;
}): AuthPayload {
  if (!data.email.endsWith('@iitb.ac.in')) {
    throw new Error('Only @iitb.ac.in email addresses are allowed.');
  }

  const payload: AuthPayload = {
    id: `user_${Math.random().toString(36).slice(2, 9)}`,
    email: data.email,
    name: data.name,
    role: 'student',
    department: data.department,
    rollNo: data.rollNo,
    year: parseInt(data.year) || 1,
    batch: data.batch,
    programme: data.programme,
    iat: Date.now(),
  };

  const token = btoa(JSON.stringify(payload));

  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(payload));
    setAuthCookie(token);
  }

  return payload;
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    clearAuthCookie();
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
  return !!decodeToken(token);
}

export function getRoleDashboardPath(role: UserRole): string {
  const map: Record<UserRole, string> = {
    student: '/student',
    instructor: '/instructor',
    admin: '/admin',
    volunteer: '/volunteer',
    'associate-instructor': '/associate-instructor',
  };
  return map[role] ?? '/student';
}
