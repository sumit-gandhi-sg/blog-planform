// src/lib/rateLimit.ts
// In-memory sliding-window rate limiter to protect sensitive routes against brute-force and DoS attacks

interface RateLimitConfig {
  limit: number;          // Maximum allowed requests within the time window
  windowSeconds: number;  // Duration of the window in seconds
}

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Checks if a given key (e.g. IP + endpoint) has exceeded its request quota.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { limit: 10, windowSeconds: 60 }
): { success: boolean; remaining: number; resetSeconds: number } {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const cutoff = now - windowMs;

  const record = rateLimitStore.get(key) || { timestamps: [] };

  // Filter out timestamps outside the active sliding window
  const recent = record.timestamps.filter((ts) => ts > cutoff);

  if (recent.length >= config.limit) {
    const oldest = recent[0];
    const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      success: false,
      remaining: 0,
      resetSeconds,
    };
  }

  recent.push(now);
  rateLimitStore.set(key, { timestamps: recent });

  return {
    success: true,
    remaining: config.limit - recent.length,
    resetSeconds: config.windowSeconds,
  };
}

/**
 * Helper to extract client IP from incoming Next.js Request headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}
