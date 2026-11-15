// src/lib/adminGuard.ts
// Zero-trust security guard for protecting administrative API routes and actions

import { getCurrentUser } from "./jwt";
import prisma from "./prisma";

export interface AdminGuardResult {
  error: string | null;
  status: 200 | 401 | 403;
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
    name?: string | null;
  } | null;
}

/**
 * Validates that the active request is authenticated and belongs to an authorized ADMIN.
 * Performs a fresh database check to protect against stale/revoked JWT tokens.
 */
export async function requireAdmin(): Promise<AdminGuardResult> {
  const payload = await getCurrentUser();

  if (!payload || !payload.id) {
    return {
      error: "Authentication required. Please sign in as an administrator.",
      status: 401,
      user: null,
    };
  }

  // Fresh DB lookup for absolute access control
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      role: true,
    },
  });

  if (!user || user.role !== "ADMIN") {
    return {
      error: "Access denied. Administrator privileges required.",
      status: 403,
      user: null,
    };
  }

  return {
    error: null,
    status: 200,
    user,
  };
}
