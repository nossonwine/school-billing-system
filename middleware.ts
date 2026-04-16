import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Allow the login page and background systems to stay open
  if (path === '/login' || path.startsWith('/api') || path.startsWith('/_next') || path === '/favicon.ico') {
    return NextResponse.next();
  }

  // Securely read the login token WITHOUT hitting the database (Prevents freezing)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || "SchoolBillingSecureKey2025!",
  });

  // 1. IF NOT LOGGED IN: Kick out to login page
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. IF PARENT TRIES TO SNEAK INTO ADMIN DASHBOARD: Kick to their portal
  if (token.role === "PARENT" && !path.startsWith('/portal')) {
    return NextResponse.redirect(new URL('/portal', request.url));
  }

  // 3. IF ADMIN TRIES TO GO TO PORTAL: Kick to admin dashboard
  if (token.role === "ADMIN" && path.startsWith('/portal')) {
    return NextResponse.redirect(new URL('/students', request.url));
  }

  // 4. HOMEPAGE TRAFFIC COP
  if (path === "/") {
    // Only kick Parents to the portal. Admins are allowed to stay on the Dashboard (/)!
    if (token.role === "PARENT") return NextResponse.redirect(new URL('/portal', request.url));
  }
  
  return NextResponse.next();
}

// Protects every single page
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};