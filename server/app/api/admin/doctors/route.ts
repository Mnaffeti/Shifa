import { getSessionUser } from '@/lib/auth';
import { fail, forbidden, ok, parseBody, unauthorized } from '@/lib/api';
import { adminCreateDoctorSchema } from '@/lib/schemas';
import { provisionDoctorAccount } from '@/lib/provision-doctor';

/**
 * POST /api/admin/doctors — back office creates a doctor account directly.
 *
 * ADMIN only. Issues a random temporary password and returns it once in the
 * response so the admin can relay it (matricule + password) to the doctor,
 * who must change it on first login (mustChangePassword).
 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (user.role !== 'ADMIN') return forbidden();

    const parsed = await parseBody(request, adminCreateDoctorSchema);
    if (!parsed.ok) return parsed.response;

    const result = await provisionDoctorAccount(parsed.data);
    return ok(result, 201);
  } catch (err) {
    if (err instanceof Error && err.message.includes('matricule')) {
      return fail(err.message, 409);
    }
    console.error('[api/admin/doctors]', err);
    return fail('Erreur serveur', 500);
  }
}
