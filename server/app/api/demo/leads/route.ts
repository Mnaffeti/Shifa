import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, forbidden, ok, unauthorized } from '@/lib/api';

/**
 * GET /api/demo/leads — who opened the demo, most recent first.
 *
 * ADMIN only. These are contact details of prospects, so neither clinical
 * staff nor a demo visitor should be able to read the list.
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
