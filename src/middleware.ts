import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "aurora_auth";

async function isAuthenticated(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes
  if (
    pathname === "/gate" ||
    pathname === "/api/auth" ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Inspector gate
  if (pathname.startsWith("/inspector")) {
    const enabled =
      process.env.ENABLE_INSPECTOR === "true" || process.env.NODE_ENV !== "production";
    if (!enabled) return new NextResponse("Not found", { status: 404 });
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const ok = await isAuthenticated(token);
  if (!ok) {
    const gate = req.nextUrl.clone();
    gate.pathname = "/gate";
    gate.searchParams.set("from", pathname);
    return NextResponse.redirect(gate);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
