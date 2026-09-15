import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, forbidden, ok, parseBody, unauthorized } from '@/lib/api';
import { adminCreateDoctorSchema } from '@/lib/schemas';
import { provisionDoctorAccount } from '@/lib/provision-doctor';

/**
 * GET /api/admin/doctors — the real doctor accounts.
 *
 * ADMIN only. Distinct from /api/demo/leads, which reads DemoLead: that table
 * is a best-effort registration log written outside the account transaction,
 * so it can silently drift. This lists Account itself, which is what the back
 * office must act on.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (user.role !== 'ADMIN') return forbidden();

    const doctors = await prisma.account.findMany({
      where: { role: 'DOCTOR' },
      orderBy: { createdAt: 'desc' },
    });

    return ok({
      doctors: doctors.map(d => ({
        id: d.id,
        name: d.name,
        matricule: d.matricule,
        specialty: d.specialty,
        phone: d.phone,
        mustChangePassword: d.mustChangePassword,
        createdAt: d.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('[api/admin/doctors GET]', err);
    return fail('Erreur serveur', 500);
  }
}

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
