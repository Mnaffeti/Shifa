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
 * Clinical data is for clinicians. ADMIN operates the product — accounts,
 * requests, activity — and must never read or write patient data.
 *
 * Authentication alone is not enough here: cookies ignore the port, so an
 * admin signed in to the back office reaches these routes with a valid
 * session. Without this check the scope-by-name filter merely returned an
 * empty list, which looked safe but let writes through and exposed rows that
 * carry no doctor name of their own (reminders).
 *
 * Returns null when the caller may proceed, or the response to send back.
 */
export function requireDoctor(user: SessionUser): NextResponse | null {
  if (user.role !== 'DOCTOR') return forbidden();

  // A pending password change is enforced here, not only by the frontend
  // redirect: an account holding a back-office-issued temporary password —
  // a value an admin knows, or that was just reset — must not be able to
  // read or write clinical data through the API until the doctor has chosen
  // their own. Only /api/auth/* stays reachable, which is what lets them.
  if (user.mustChangePassword) {
    return fail('Vous devez définir votre mot de passe avant de continuer', 403);
  }

  return null;
}

/**
 * A doctor may only reach their own patients.
 *
 * Scoped by account id, not by display name. Names are neither unique nor
 * stable: two doctors could share one — and then share each other's patients —
 * and renaming yourself in settings used to orphan every record you owned.
 */
export function patientScope(user: SessionUser) {
  return { doctorId: user.id };
}

/** Pass the patient's `doctorId`. Null means unassigned: nobody may read it. */
export function canAccessPatient(user: SessionUser, doctorId: string | null): boolean {
  return doctorId !== null && doctorId === user.id;
}
