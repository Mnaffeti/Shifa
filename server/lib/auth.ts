import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from './prisma';
import type { UserRole } from '@prisma/client';

/**
 * Stateless signed-cookie sessions. The cookie carries the account id plus an
 * expiry, signed with SESSION_SECRET so it cannot be forged client-side.
 *
 * This replaces the old localStorage `shifa_auth` blob, which the browser
 * could edit freely — meaning any user could previously grant themselves the
 * DOCTOR role just by editing devtools.
 */

const COOKIE_NAME = 'shifa_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      'SESSION_SECRET is missing or too short (need >= 32 chars). ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  return s;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

/** Constant-time compare so signature checks don't leak timing information. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function createSessionToken(accountId: string): string {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${accountId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

function verifySessionToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [accountId, expiresAt, signature] = parts;
  const payload = `${accountId}.${expiresAt}`;
  if (!safeEqual(signature, sign(payload))) return null;
  if (Number(expiresAt) < Date.now()) return null;

  return accountId;
}

/**
 * Cookie attributes differ by deployment shape.
 *
 * When the frontend and API are on different domains (two Vercel projects),
 * the session cookie is sent cross-site, which requires SameSite=None — and
 * browsers only accept that together with Secure. `sameSite: 'lax'` would
 * silently drop the cookie on every cross-origin call, making login look like
 * it worked while every later request came back 401.
 *
 * Set CROSS_SITE_COOKIE=true when the two are on different domains. Leave it
 * unset for same-domain deploys, where Lax is the safer default (it gives
 * some CSRF protection for free).
 */
function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  const crossSite = process.env.CROSS_SITE_COOKIE === 'true';

  return {
    httpOnly: true,
    sameSite: (crossSite ? 'none' : 'lax') as 'none' | 'lax',
    // SameSite=None is rejected by browsers unless Secure is also set.
    secure: isProd || crossSite,
    path: '/',
  };
}

export async function setSessionCookie(accountId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, createSessionToken(accountId), {
    ...cookieOptions(),
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  // Overwrite with an expired cookie using the same attributes — a plain
  // delete() can leave a cross-site cookie in place, since the browser
  // matches on SameSite/Secure/path too.
  store.set(COOKIE_NAME, '', { ...cookieOptions(), maxAge: 0 });
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: UserRole;
  specialty: string | null;
}

/** Resolves the signed-in account, or null when unauthenticated. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const accountId = verifySessionToken(token);
  if (!accountId) return null;

  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return null;

  return {
    id: account.id,
    email: account.email,
    name: account.name,
    avatar: account.avatar,
    role: account.role,
    specialty: account.specialty,
  };
}
