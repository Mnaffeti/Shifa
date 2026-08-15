import { NextResponse } from 'next/server';
import { ZodError, type ZodSchema } from 'zod';
import { getSessionUser, type SessionUser } from './auth';

/** Shared response/guard helpers so every route handles errors identically. */

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status: number, extra?: unknown) {
  return NextResponse.json({ error: message, ...(extra ? { details: extra } : {}) }, { status });
}

export const unauthorized = () => fail('Non authentifié', 401);
export const forbidden = () => fail('Accès refusé', 403);
export const notFound = (what = 'Ressource') => fail(`${what} introuvable`, 404);

/**
 * Wraps a handler so it only runs for an authenticated caller, and so any
 * thrown error becomes a 500 instead of leaking a stack trace to the client.
 */
export function withAuth<T>(
  handler: (user: SessionUser) => Promise<NextResponse<T>>,
) {
  return async (): Promise<NextResponse> => {
    try {
      const user = await getSessionUser();
      if (!user) return unauthorized();
      return await handler(user);
    } catch (err) {
      console.error('[api]', err);
      return fail('Erreur serveur', 500);
    }
  };
}

/** Parses and validates a JSON body, returning a 400 on malformed input. */
export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: fail('Corps de requête JSON invalide', 400) };
  }

  try {
    return { ok: true, data: schema.parse(raw) };
  } catch (err) {
    if (err instanceof ZodError) {
      return { ok: false, response: fail('Données invalides', 400, err.flatten().fieldErrors) };
    }
    throw err;
  }
}

/**
 * A doctor may only reach their own patients; a secretary sees everyone.
 * Centralised so the rule can't drift between routes.
 */
export function patientScope(user: SessionUser) {
  return user.role === 'DOCTOR' ? { assignedDoctor: user.name } : {};
}

export function canAccessPatient(user: SessionUser, assignedDoctor: string): boolean {
  return user.role === 'SECRETARY' || assignedDoctor === user.name;
}
