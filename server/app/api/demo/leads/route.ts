import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, forbidden, ok, unauthorized } from '@/lib/api';

/**
 * GET /api/demo/leads — who opened the demo, most recent first.
 *
 * Requires a real (non-demo) session: a demo visitor must not be able to read
 * the contact details of every other visitor.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const account = await prisma.account.findUnique({
      where: { id: user.id },
      select: { isDemo: true },
    });
    if (account?.isDemo) return forbidden();

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
