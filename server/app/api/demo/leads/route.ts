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

    // accountId isn't a Prisma relation (the lead survives account deletion),
    // so the matching accounts are fetched separately and joined in memory.
    const accountIds = leads.map(l => l.accountId).filter((id): id is string => !!id);
    const accounts = accountIds.length
      ? await prisma.account.findMany({
          where: { id: { in: accountIds } },
          select: { id: true, matricule: true, tempPassword: true },
        })
      : [];
    const accountById = new Map(accounts.map(a => [a.id, a]));

    return ok({
      leads: leads.map(l => {
        const account = l.accountId ? accountById.get(l.accountId) : undefined;
        return {
          id: l.id,
          name: l.name,
          phone: l.phone,
          specialty: l.specialty,
          email: l.email,
          matricule: account?.matricule ?? null,
          // Only ever non-null while the doctor hasn't set their own
          // password yet — see Account.tempPassword.
          tempPassword: account?.tempPassword ?? null,
          visits: l.visits,
          createdAt: l.createdAt.toISOString(),
          lastSeenAt: l.lastSeenAt.toISOString(),
        };
      }),
    });
  } catch (err) {
    console.error('[api/demo/leads]', err);
    return fail('Erreur serveur', 500);
  }
}
