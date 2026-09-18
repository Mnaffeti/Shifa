import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, forbidden, ok, parseBody, unauthorized } from '@/lib/api';
import { adminCreateDoctorSchema } from '@/lib/schemas';
import { provisionDoctorAccount } from '@/lib/provision-doctor';
import { recordAudit } from '@/lib/audit';
import { trialDaysLeft } from '@/lib/trial';

/**
 * GET /api/admin/doctors — the real doctor accounts.
 *
 * ADMIN only. Account is the single source of truth for the back office: it
 * carries the identity, the access flag and the activity counters, so nothing
 * can drift away from the row it describes.
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
        isActive: d.isActive,
        lastLoginAt: d.lastLoginAt?.toISOString() ?? null,
        loginCount: d.loginCount,
        trialEndsAt: d.trialEndsAt?.toISOString() ?? null,
        /** Null = unlimited access; 0 = expired. */
        trialDaysLeft: trialDaysLeft(d),
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

    // The temporary password is deliberately absent from the log.
    await recordAudit({
      actor: user,
      action: 'DOCTOR_CREATED',
      targetLabel: `${result.doctor.name} (${result.doctor.matricule})`,
      details: `Spécialité : ${result.doctor.specialty}`,
    });

    return ok(result, 201);
  } catch (err) {
    if (err instanceof Error && err.message.includes('matricule')) {
      return fail(err.message, 409);
    }
    console.error('[api/admin/doctors]', err);
    return fail('Erreur serveur', 500);
  }
}
