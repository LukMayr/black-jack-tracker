// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "~/server/db"; // Make sure this path is correct

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const isAuth = !!token;
  const path = req.nextUrl.pathname;

  const isAuthPage = path.startsWith("/auth") && path !== "/auth/username" && path !== "/";
  const isApiRoute = path.startsWith("/api");
  const isStaticAsset = path.startsWith("/_next") || path.startsWith("/favicon.ico");


  if (isStaticAsset || isApiRoute) {
    return NextResponse.next(); // Skip middleware for static or API routes
  }

  // ✅ If authenticated user tries to access auth page, redirect them to dashboard
  if (isAuthPage && isAuth) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ✅ If unauthenticated and not on auth page, redirect to login
  if (!isAuth && !isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
