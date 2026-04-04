import { auth } from '@/auth';
import { NextRequest } from 'next/server';

export async function getSessionUser() {
  const session = await auth();
  return session?.user;
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip');
  return ip || 'unknown';
}

export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || '';
}

export const rateLimit = (() => {
  const cache = new Map<string, { count: number; resetTime: number }>();
  return {
    check: (key: string, limit: number = 10, windowMs: number = 60000): boolean => {
      const now = Date.now();
      const record = cache.get(key);

      if (!record || now > record.resetTime) {
        cache.set(key, { count: 1, resetTime: now + windowMs });
        return true;
      }

      if (record.count < limit) {
        record.count++;
        return true;
      }

      return false;
    },
    reset: (key: string) => cache.delete(key),
  };
})();

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
