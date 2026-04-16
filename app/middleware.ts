import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // 1. KICK PARENTS TO THE PORTAL
    // If a parent tries to go anywhere except their portal, force them back.
    if (token?.role === "PARENT" && !path.startsWith("/portal")) {
      return NextResponse.redirect(new URL("/portal", req.url));
    }

    // 2. KICK ADMINS OUT OF THE PARENT PORTAL
    // If you (Admin) accidentally go to the parent portal, redirect to the dashboard.
    if (token?.role === "ADMIN" && path.startsWith("/portal")) {
      return NextResponse.redirect(new URL("/students", req.url));
    }
    
    // 3. HOMEPAGE REDIRECT
    // If someone goes to the base URL (yoursite.com/), send them to the right place
    if (path === "/") {
      if (token?.role === "ADMIN") return NextResponse.redirect(new URL("/students", req.url));
      if (token?.role === "PARENT") return NextResponse.redirect(new URL("/portal", req.url));
    }
  },
  {
    callbacks: {
      // This rule says: "You MUST have a valid login token to enter."
      authorized: ({ token }) => !!token,
    },
  }
);

// --- THE SECURITY PERIMETER ---
// This tells the Bouncer to protect EVERY page on the site...
// EXCEPT the login page, the API (so logins work), and background images/CSS.
export const config = {
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico).*)"],
};