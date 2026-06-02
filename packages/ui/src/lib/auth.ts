import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "aurora_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set and at least 32 chars");
  }
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(subject = "aurora"): Promise<string> {
  return await new SignJWT({ sub: subject })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAuthToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export const AUTH_COOKIE = {
  name: COOKIE_NAME,
  maxAge: COOKIE_MAX_AGE,
} as const;
