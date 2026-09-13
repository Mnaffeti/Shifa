import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, forbidden, ok, unauthorized } from '@/lib/api';

/** GET /api/admin/doctor-requests — pending-first list of doctor requests. ADMIN only. */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (user.role !== 'ADMIN') return forbidden();

    const requests = await prisma.doctorRequest.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    return ok({
      requests: requests.map(r => ({
        id: r.id,
        name: r.name,
        matricule: r.matricule,
        specialty: r.specialty,
        phone: r.phone,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('[api/admin/doctor-requests GET]', err);
    return fail('Erreur serveur', 500);
  }
}
