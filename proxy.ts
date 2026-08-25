import { NextRequest, NextResponse } from "next/server";
import type { Session } from "@/lib/auth";
import { betterFetch } from "@better-fetch/fetch";

const protectedRoutes = ["/dashboard", "/admin", "/settings"];
const authRoutes = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ini adalah data dari migrasi middleware
  if (pathname.startsWith("/api")) {
    console.log(`[API Request] ${request.method} ${pathname}`);
    return NextResponse.next();
  }

  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") || ""
      }
    }
  );

  const isProtected = protectedRoutes.some((route) => 
    pathname.startsWith(route)
  );

  const isAuthRoute = authRoutes.some((route) => 
    pathname.startsWith(route)
  )

  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path", "/admin/:path", "/settings/:path", "/login", "/register", "/api/:path"]
}