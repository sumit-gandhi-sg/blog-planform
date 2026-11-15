import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET_KEY || "default_dev_jwt_secret_change_me";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET_KEY || "default_dev_refresh_secret";
const RESET_SECRET = process.env.JWT_RESET_SECRET_KEY || `${JWT_SECRET}_reset`;

export const AUTH_COOKIE_NAME = "inkwell_token";
export const REFRESH_COOKIE_NAME = "inkwell_refresh";

export interface TokenPayload {
  id: string;
  email: string;
  username: string;
  role?: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

export function signPasswordResetToken(user: { id: string; email: string }): string {
  return jwt.sign({ id: user.id, email: user.email, purpose: "pwd_reset" }, RESET_SECRET, {
    expiresIn: "15m",
  });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyPasswordResetToken(token: string): { id: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, RESET_SECRET) as { id: string; email: string; purpose: string };
    if (decoded.purpose !== "pwd_reset") return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

export async function setAuthCookies(payload: TokenPayload) {
  const cookieStore = await cookies();
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const isProduction = process.env.NODE_ENV === "production";

  cookieStore.set(AUTH_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });

  cookieStore.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  cookieStore.delete(REFRESH_COOKIE_NAME);
}
