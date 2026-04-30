import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/signup'];
const PROTECTED_PATHS = ['/home', '/student', '/instructor', '/admin', '/volunteer', '/associate-instructor'];

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
  const payload = token ? decodeToken(token) : null;
  const isLoggedIn = !!payload;

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/home', request.url));
    }
    return NextResponse.next();
  }

  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/signup', '/home/:path*', '/student/:path*', '/instructor/:path*', '/admin/:path*', '/volunteer/:path*', '/associate-instructor/:path*'],
};
