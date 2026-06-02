import { NextRequest, NextResponse } from "next/server";
import { signAuthToken, AUTH_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const expected = process.env.AUTH_PASSWORD;
  if (!expected) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 500 });
  }

  if (body.password !== expected) {
    return NextResponse.json({ ok: false, error: "invalid_password" }, { status: 401 });
  }

  const token = await signAuthToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE.name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: process.env.BASE_PATH || "/",
    maxAge: AUTH_COOKIE.maxAge,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(AUTH_COOKIE.name);
  return res;
}
