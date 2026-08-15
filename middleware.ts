import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.pathname;
  const method = req.method;
  
  // Log every API request
  console.log(`[API Request] ${method} ${url}`);
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
