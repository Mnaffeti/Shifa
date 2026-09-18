import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, forbidden, notFound, ok, unauthorized } from '@/lib/api';
import { provisionDoctorAccount } from '@/lib/provision-doctor';
import { recordAudit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/doctor-requests/:id/accept — creates the doctor account
 * from a pending request and issues a temporary password (returned once).
 * ADMIN only.
 */
export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (user.role !== 'ADMIN') return forbidden();

    const { id } = await params;
    const doctorRequest = await prisma.doctorRequest.findUnique({ where: { id } });
    if (!doctorRequest) return notFound('Demande');
    if (doctorRequest.status !== 'PENDING') {
      return fail('Cette demande a déjà été traitée', 409);
    }

    let result;
    try {
      result = await provisionDoctorAccount(doctorRequest);
    } catch (err) {
      if (err instanceof Error && err.message.includes('matricule')) {
        return fail(err.message, 409);
      }
      throw err;
    }

    await prisma.doctorRequest.update({ where: { id }, data: { status: 'ACCEPTED' } });

    await recordAudit({
      actor: user,
      action: 'REQUEST_ACCEPTED',
      targetLabel: `${result.doctor.name} (${result.doctor.matricule})`,
      details: `Demande du ${doctorRequest.createdAt.toISOString().split('T')[0]} · ${result.doctor.specialty}`,
    });

    return ok(result);
  } catch (err) {
    console.error('[api/admin/doctor-requests/:id/accept]', err);
    return fail('Erreur serveur', 500);
  }
}
