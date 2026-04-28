import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED = ['/student', '/instructor', '/admin', '/volunteer', '/associate-instructor'];
const ROLE_PATHS: Record<string, string> = {
  student: '/student',
  instructor: '/instructor',
  admin: '/admin',
  volunteer: '/volunteer',
  'associate-instructor': '/associate-instructor',
};

function decodeToken(token: string) {
  try {
    return JSON.parse(atob(token));
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('fh_auth')?.value;
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));

  if (pathname === '/login') {
    if (token) {
      const payload = decodeToken(token);
      if (payload?.role) {
        return NextResponse.redirect(new URL(ROLE_PATHS[payload.role] ?? '/student', request.url));
      }
    }
    return NextResponse.next();
  }

  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const payload = decodeToken(token);
    if (!payload) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const correctPath = ROLE_PATHS[payload.role];
    if (correctPath && !pathname.startsWith(correctPath)) {
      return NextResponse.redirect(new URL(correctPath, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/student/:path*', '/instructor/:path*', '/admin/:path*', '/volunteer/:path*', '/associate-instructor/:path*'],
};
