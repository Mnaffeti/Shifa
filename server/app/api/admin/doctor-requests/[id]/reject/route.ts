import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, forbidden, notFound, ok, unauthorized } from '@/lib/api';
import { recordAudit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

/** POST /api/admin/doctor-requests/:id/reject — marks a pending request rejected. ADMIN only. */
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

    await prisma.doctorRequest.update({ where: { id }, data: { status: 'REJECTED' } });

    // No account exists for a rejected request, so the log keeps the details
    // from the request itself.
    await recordAudit({
      actor: user,
      action: 'REQUEST_REJECTED',
      targetLabel: `${doctorRequest.name} (${doctorRequest.matricule})`,
      details: `Demande du ${doctorRequest.createdAt.toISOString().split('T')[0]} · ${doctorRequest.specialty}`,
    });

    return ok({ success: true as const });
  } catch (err) {
    console.error('[api/admin/doctor-requests/:id/reject]', err);
    return fail('Erreur serveur', 500);
  }
}
