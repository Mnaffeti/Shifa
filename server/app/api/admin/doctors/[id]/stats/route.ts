import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, forbidden, notFound, ok, unauthorized } from '@/lib/api';

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/doctors/:id/stats — activity counters for one doctor.
 * ADMIN only.
 *
 * Deliberately counters only: no patient names, no appointment details, no
 * consultation content. An admin operates the product and must never read
 * clinical data — these numbers tell them whether an account is in real use
 * (so, whether deleting it would strand records) without exposing any of it.
 *
 * Counting is by doctorId, so renaming a doctor leaves their totals intact.
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (user.role !== 'ADMIN') return forbidden();

    const { id } = await params;
    const account = await prisma.account.findUnique({ where: { id } });
    if (!account) return notFound('Compte');
    if (account.role !== 'DOCTOR') {
      return fail('Seuls les comptes médecins ont des statistiques cliniques', 403);
    }

    const [patients, appointments, consultations, upcoming] = await Promise.all([
      prisma.patient.count({ where: { doctorId: account.id } }),
      prisma.appointment.count({ where: { doctorId: account.id } }),
      prisma.consultation.count({ where: { doctorId: account.id } }),
      prisma.appointment.count({
        where: {
          doctorId: account.id,
          date: { gte: new Date().toISOString().split('T')[0] },
          status: { in: ['Pending', 'Confirmed'] },
        },
      }),
    ]);

    return ok({ stats: { patients, appointments, consultations, upcoming } });
  } catch (err) {
    console.error('[api/admin/doctors/:id/stats]', err);
    return fail('Erreur serveur', 500);
  }
}
