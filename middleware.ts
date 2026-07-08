import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/signup'];
const PROTECTED_PATHS = ['/home', '/student', '/instructor', '/admin', '/volunteer', '/associate-instructor'];

function decodeToken(token: string) {
  try {
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode the payload (second part)
    const payload = parts[1];
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    return JSON.parse(atob(paddedPayload));
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check for token in cookie
  const cookieToken = request.cookies.get('token')?.value;
  const payload = cookieToken ? decodeToken(cookieToken) : null;
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
      return NextResponse.redirect(new URL('/signup', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/signup', '/home/:path*', '/student/:path*', '/instructor/:path*', '/admin/:path*', '/volunteer/:path*', '/associate-instructor/:path*'],
};
