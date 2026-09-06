import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, forbidden, ok, unauthorized } from '@/lib/api';

/**
 * GET /api/demo/leads — registered doctors, most recently active first.
 *
 * ADMIN only: these are contact details, so clinical staff must not be able
 * to read the whole list.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (user.role !== 'ADMIN') return forbidden();

    const leads = await prisma.demoLead.findMany({ orderBy: { lastSeenAt: 'desc' } });

    return ok({
      leads: leads.map(l => ({
        id: l.id,
        name: l.name,
        phone: l.phone,
        specialty: l.specialty,
        email: l.email,
        visits: l.visits,
        createdAt: l.createdAt.toISOString(),
        lastSeenAt: l.lastSeenAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('[api/demo/leads]', err);
    return fail('Erreur serveur', 500);
  }
}
