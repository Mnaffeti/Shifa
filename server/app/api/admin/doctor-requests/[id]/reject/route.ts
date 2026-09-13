import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, forbidden, notFound, ok, unauthorized } from '@/lib/api';

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
    return ok({ success: true as const });
  } catch (err) {
    console.error('[api/admin/doctor-requests/:id/reject]', err);
    return fail('Erreur serveur', 500);
  }
}
